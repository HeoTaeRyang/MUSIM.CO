from .db import get_connection

# 자세 분석 결과 저장
def save_posture_result(user_id, video_id, result_text, image_url):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO Posture (user_id, video_id, result_text, image_url, saved_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (user_id, video_id, result_text, image_url))
            conn.commit()
            result_id = cursor.lastrowid
            cursor.execute("SELECT * FROM Posture WHERE id = %s", (result_id,))
            return cursor.fetchone()
