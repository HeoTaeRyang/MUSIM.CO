from .db import con

# 랜덤 영상 1개
def get_random_video():
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND() LIMIT 1")
        return cursor.fetchone()
    
# 랜덤 영상 여러개
def get_random_videos():
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND()")
        return cursor.fetchall()

# 자세 교정 영상만
def get_correctable_videos():
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE correctable = 1")
        return cursor.fetchall()
    
# 즐겨찾기 영상만
def get_favorite_videos(user_id):
    with con.cursor() as cursor:
        cursor.execute("""
                       SELECT v.*
                       FROM Video v
                       JOIN Favorite f ON v.id = f.video_id
                       WHERE f.user_id = %s
                       ORDER BY f.favorite_date DESC
                       """, (user_id,))
        return cursor.fetchall()
    
# 정렬
def get_sort_videos(keyword):
    keywords = {
        '최신순': 'upload_date DESC',
        '추천순': 'recommendations DESC',
        '조회순': 'views DESC' 
    }
    query = keywords.get(keyword)
    
    with con.cursor() as cursor:
        cursor.execute(f"SELECT * FROM Video ORDER BY {query}")
        return cursor.fetchall()
    
# 검색
def get_search_videos(keyword):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE title LIKE %s", (f"%{keyword}%",))
        return cursor.fetchall()
    
    # 영상 상세 조회
def get_video_by_id(video_id):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Video WHERE id = %s", (video_id,))
        return cursor.fetchone()

# 즐겨찾기 추가/삭제 (toggle 방식)
def toggle_favorite(user_id, video_id):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Favorite WHERE user_id = %s AND video_id = %s", (user_id, video_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("DELETE FROM Favorite WHERE user_id = %s AND video_id = %s", (user_id, video_id))
        else:
            cursor.execute("INSERT INTO Favorite (user_id, video_id, favorite_date) VALUES (%s, %s, NOW())", (user_id, video_id))
        con.commit()

# 추천 추가 (중복 방지)
def add_recommendation(user_id, video_id):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM Recommendation WHERE user_id = %s AND video_id = %s", (user_id, video_id))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO Recommendation (user_id, video_id) VALUES (%s, %s)", (user_id, video_id))
            cursor.execute("UPDATE Video SET recommendations = recommendations + 1 WHERE id = %s", (video_id,))
            con.commit()
