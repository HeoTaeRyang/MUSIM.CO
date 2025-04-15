import pymysql

con = pymysql.connect(
    host='localhost',  
    user='root',  
    password='0000',  
    database='musimco',  
    cursorclass=pymysql.cursors.DictCursor
)