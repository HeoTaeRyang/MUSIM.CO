import cv2
import torch
import mediapipe as mp
import torch.nn as nn

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
            nn.Linear(dim, dim),
            nn.BatchNorm1d(dim),
        )
        self.relu = nn.ReLU()

    def forward(self, x):
        return self.relu(x + self.block(x))

class ResNetTSMClassifier(nn.Module):
    def __init__(self, input_dim=48, n_segment=8, hidden_dim=128):
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
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, x):  # x: (B, T, C)
        B, T, C = x.shape
        x = x.view(B * T, C)
        x = self.temporal_shift(x)
        x = x.view(B, T, -1).permute(0, 2, 1)
        return self.classifier(x).squeeze(1)

# === 관절 추출 ===
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

# === MP4 추론 ===
def evaluate_video(frames, model_path, input_dim=48, seq_len=8, threshold=0.5):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = ResNetTSMClassifier(input_dim=input_dim, n_segment=seq_len).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    
    coord_list = [], []

    print("프레임에서 관절 추출 중...")
    for frame in frames:
        coords = extract_mediapipe_keypoints(frame)
        if coords:
            coord_list.append(coords)
        else:
            coord_list.append(None)

    print(f"총 유효 프레임 수: {len(coord_list)}")

    used_idx = set()
    for i in range(0, len(coord_list) - seq_len + 1):
        seq = coord_list[i:i+seq_len]
        seq_tensor = torch.tensor([seq], dtype=torch.float32).to(device)
        with torch.no_grad():
            pred = torch.sigmoid(model(seq_tensor)).item()
            if pred > threshold:
                for j in range(i, i + seq_len):
                    used_idx.add(j)

    active_frames = [frames[i] for i in sorted(used_idx) if i < len(frames)]
    print(f"Active로 판별된 프레임 수: {len(active_frames)}")

    return active_frames