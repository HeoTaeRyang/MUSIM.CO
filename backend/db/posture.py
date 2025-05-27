from .db import con

# 자세 교정 분석 결과 저장
def save_posture_result(user_id, video_id, result_text, image_url):
    with con.cursor() as cursor:
        cursor.execute("""
            INSERT INTO PostureResult (user_id, video_id, result_text, image_url, saved_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user_id, video_id, result_text, image_url))
        con.commit()
        result_id = cursor.lastrowid
        cursor.execute("SELECT * FROM PostureResult WHERE id = %s", (result_id,))
        return cursor.fetchone()
