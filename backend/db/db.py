import pymysql

con = pymysql.connect(
    host='localhost',
    user='root',
    password='0000',
    db='musimco',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
