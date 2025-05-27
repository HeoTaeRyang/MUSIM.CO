import pymysql

def get_connection():
    return pymysql.connect(
        host='centerbeam.proxy.rlwy.net',
        port=21462,
        user='root',
        password='KnaOFbzLtjWhKWMBjCdHdBCFezdJayot',
        database='musimco',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
