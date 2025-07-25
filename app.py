from flask import Flask, render_template
import os

app = Flask(__name__)

# 确保中文显示正常
app.config['JSON_AS_ASCII'] = False

@app.route('/')
def birthday_wish():
    # 生日日期 - 请修改为实际的生日日期
    birthday_date = "2006-07-27"  # 格式: 年-月-日
    return render_template('index.html', birthday_date=birthday_date)

if __name__ == '__main__':
    # 确保静态文件目录存在
    os.makedirs(os.path.join(app.root_path, 'static', 'images'), exist_ok=True)
    os.makedirs(os.path.join(app.root_path, 'static', 'music'), exist_ok=True)
    app.run(host='0.0.0.0', port=1314, debug=True)
