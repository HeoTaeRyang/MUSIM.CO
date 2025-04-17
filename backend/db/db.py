import pymysql

con = pymysql.connect(
    host='localhost',  
    user='root',  
    password='0000',  
    database='musimco',  
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
