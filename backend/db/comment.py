# db/comment.py
from .db import get_connection

# 댓글 등록
def add_comment(video_id, user_id, content):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO Comment (video_id, user_id, content, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (video_id, user_id, content))
            comment_id = cursor.lastrowid
            conn.commit()
            cursor.execute("SELECT * FROM Comment WHERE id = %s", (comment_id,))
            return cursor.fetchone()

# 댓글 목록 조회 (최신순 또는 추천순)
def get_comments_by_video(video_id, sort):
    order = "created_at DESC" if sort == "latest" else "recommend_count DESC"
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT * FROM Comment
                WHERE video_id = %s
                ORDER BY {order}
            """, (video_id,))
            return cursor.fetchall()

# 댓글 추천 - 댓글 추천 취소 기능이 없어 아래의 토글 함수 사용
def recommend_comment(user_id, comment_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM CommentRecommendation WHERE user_id = %s AND comment_id = %s", (user_id, comment_id))
            if cursor.fetchone():
                return False

            cursor.execute("""
                INSERT INTO CommentRecommendation (user_id, comment_id)
                VALUES (%s, %s)
            """, (user_id, comment_id))

            cursor.execute("""
                UPDATE Comment SET recommend_count = recommend_count + 1
                WHERE id = %s
            """, (comment_id,))
            conn.commit()
            return True

# 댓글 추천
def toggle_recommend_comment(user_id, comment_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM CommentRecommendation WHERE user_id = %s AND comment_id = %s", (user_id, comment_id))
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("DELETE FROM CommentRecommendation WHERE user_id = %s AND comment_id = %s", (user_id, comment_id))
                cursor.execute("UPDATE Comment SET recommend_count = GREATEST(recommend_count - 1, 0) WHERE id = %s", (comment_id,))
                conn.commit()
                return False
            else:
                cursor.execute("INSERT INTO CommentRecommendation (user_id, comment_id) VALUES (%s, %s)", (user_id, comment_id))
                cursor.execute("UPDATE Comment SET recommend_count = recommend_count + 1 WHERE id = %s", (comment_id,))
                conn.commit()
                return True
            
# 댓글 추천수 조회
def get_comment_recommend_count(comment_id):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT recommend_count FROM Comment WHERE id = %s", (comment_id,))
        result = cursor.fetchone()
        if result:
            return result['recommend_count']
        return 0