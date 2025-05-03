from .db import con

# 랜덤 영상 1개
def get_random_video():
    with con.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND() LIMIT 1")
        return cursor.fetchone()
    
# 랜덤 영상 여러개
def get_random_videos():
    with con.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY RAND()")
        return cursor.fetchall()

# 자세 교정 영상만
def get_correctable_videos():
    with con.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Video WHERE correctable = 1")
        return cursor.fetchall()
    
# 즐겨찾기 영상만
def get_favorite_videos(user_id):
    with con.cursor(dictionary=True) as cursor:
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
    
    with con.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Video ORDER BY %s", (query,))
        return cursor.fetchall()
    
# 검색
def get_search_videos(keyword):
    with con.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM Video WHERE title LIKE %s", (f"%{keyword}%",))
        return cursor.fetchall()