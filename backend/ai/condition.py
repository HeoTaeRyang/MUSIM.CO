import cv2
import torch
import numpy as np
import mediapipe as mp
import torch.nn as nn
import mediapipe as mp
import os

# === TSM ===
class TemporalShift(nn.Module):
    def __init__(self, net, n_segment=8, n_div=8):
        super().__init__()
        self.net = net
        self.n_segment = n_segment
        self.fold_div = n_div

    def forward(self, x):
        nt, c = x.size(0), x.size(1)
        n_batch = nt // self.n_segment
        x = x.view(n_batch, self.n_segment, c)
        fold = c // self.fold_div

        out = torch.zeros_like(x)
        out[:, 1:, :fold] = x[:, :-1, :fold]
        out[:, :-1, fold:2*fold] = x[:, 1:, fold:2*fold]
        out[:, :, 2*fold:] = x[:, :, 2*fold:]
        x = out.view(nt, c)
        return self.net(x)

# === 모델 정의 ===
class MLPResNetBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.block = nn.Sequential(
            nn.Linear(dim, dim),
            nn.BatchNorm1d(dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(dim, dim),
            nn.BatchNorm1d(dim),
            nn.Dropout(0.3)
        )
        self.relu = nn.ReLU()

    def forward(self, x):
        return self.relu(x + self.block(x))

class PoseCorrectionTSMClassifier(nn.Module):
    def __init__(self, input_dim=48, n_segment=8, hidden_dim=128, num_conditions=5):
        super().__init__()
        self.n_segment = n_segment
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            MLPResNetBlock(hidden_dim),
            MLPResNetBlock(hidden_dim)
        )
        self.temporal_shift = TemporalShift(self.feature_extractor, n_segment=n_segment)
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(hidden_dim, num_conditions),
            nn.Sigmoid()
        )

    def forward(self, x):
        B, T, C = x.shape
        x = x.view(B * T, C)
        x = self.temporal_shift(x)
        x = x.view(B, T, -1).permute(0, 2, 1)
        return self.classifier(x)

# === 관절 추출 ===
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True)

def extract_mediapipe_keypoints(frame):
    results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not results.pose_landmarks:
        return None
    coords = []
    for lm in results.pose_landmarks.landmark[:24]:
        coords.extend([lm.x, lm.y])
    return coords  # 48차원

# === 영상 평가 ===
def evaluate(frames, model_path, input_dim=48, seq_len=8, num_conditions=5, threshold=0.5):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = PoseCorrectionTSMClassifier(input_dim=input_dim, n_segment=seq_len, num_conditions=num_conditions).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    coord_list = []
    annotated_frames = []

    for idx, frame in enumerate(frames):
        results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        annotated_frame = frame.copy()
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                image=annotated_frame,
                landmark_list=results.pose_landmarks,
                connections=mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
            )
            
            coords = []
            for lm in results.pose_landmarks.landmark[:24]:
                coords.extend([lm.x, lm.y])
                
            coord_list.append(coords)
            annotated_frames.append(annotated_frame)

    if len(coord_list) < seq_len:
        return {
            "valid": False,
            "message": "시퀀스 길이 부족 평가 불가",
            "results": [],
            "annotated_frames": annotated_frames
        }

    preds = []
    for i in range(0, len(coord_list) - seq_len + 1):
        seq = coord_list[i:i + seq_len]
        seq_tensor = torch.tensor([seq], dtype=torch.float32).to(device)
        with torch.no_grad():
            pred = model(seq_tensor)[0].cpu().numpy()
        preds.append(pred)

    preds = np.array(preds)
    mean_preds = preds.mean(axis=0)

    results = []
    for i, score in enumerate(mean_preds):
        results.append({
            "condition": i,
            "value": bool(score > threshold),
            "score": float(score)
        })

    return {
        "results": results,
        "annotated_frames": annotated_frames  # 추가된 프레임 리스트
    }