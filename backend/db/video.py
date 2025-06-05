from db.db import get_connection

def get_random_video():
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND() LIMIT 1")
        return cursor.fetchone()

def get_random_videos():
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND()")
        return cursor.fetchall()

def get_correctable_videos():
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE correctable = 1")
        return cursor.fetchall()

def get_favorite_videos(user_id):
    with get_connection().cursor() as cursor:
        cursor.execute("""
            SELECT v.* FROM Video v
            JOIN Favorite f ON v.id = f.video_id
            WHERE f.user_id = %s
            ORDER BY f.favorite_date DESC
        """, (user_id,))
        return cursor.fetchall()

def get_sort_videos(keyword):
    keywords = {
        '최신순': 'upload_date DESC',
        '추천순': 'recommendations DESC',
        '조회순': 'views DESC' 
    }
    query = keywords.get(keyword, 'upload_date DESC')
    with get_connection().cursor() as cursor:
        cursor.execute(f"SELECT * FROM Video ORDER BY {query}")
        return cursor.fetchall()

def get_search_videos(keyword):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE title LIKE %s", (f"%{keyword}%",))
        return cursor.fetchall()

def get_video_by_id(video_id):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE id = %s", (video_id,))
        return cursor.fetchone()

def toggle_favorite(user_id, video_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM Favorite WHERE user_id = %s AND video_id = %s", (user_id, video_id))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("DELETE FROM Favorite WHERE user_id = %s AND video_id = %s", (user_id, video_id))
                conn.commit()
                return False
            else:
                cursor.execute("INSERT INTO Favorite (user_id, video_id, favorite_date) VALUES (%s, %s, NOW())", (user_id, video_id))
                conn.commit()
                return True

# 영상 추천 (사용 안함)
def add_recommendation(user_id, video_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM Recommendation WHERE user_id = %s AND video_id = %s", (user_id, video_id))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO Recommendation (user_id, video_id) VALUES (%s, %s)", (user_id, video_id))
                cursor.execute("UPDATE Video SET recommendations = recommendations + 1 WHERE id = %s", (video_id,))
                conn.commit()

# 영상 추천
def toggle_recommend_video(user_id, video_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM Recommendation WHERE user_id = %s AND video_id = %s", (user_id, video_id))
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("DELETE FROM Recommendation WHERE user_id = %s AND video_id = %s", (user_id, video_id))
                cursor.execute("UPDATE Video SET recommendations = GREATEST(recommendations - 1, 0) WHERE id = %s", (video_id,))
                conn.commit()
                return False
            else:
                cursor.execute("INSERT INTO Recommendation (user_id, video_id) VALUES (%s, %s)", (user_id, video_id))
                cursor.execute("UPDATE Video SET recommendations = recommendations + 1 WHERE id = %s", (video_id,))
                conn.commit()
                return True
            
# 영상 추천수 조회
def get_video_recommend_count(video_id):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT recommendations FROM Video WHERE id = %s", (video_id,))
        result = cursor.fetchone()
        if result:
            return result['recommendations']
        return 0

def increase_view_count(video_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE Video SET views = views + 1 WHERE id = %s", (video_id,))
            conn.commit()