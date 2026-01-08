import os
from flask import Flask, render_template, request, send_file
import sqlite3
import pandas as pd

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        email TEXT
    )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        phone = request.form["phone"]
        email = request.form["email"]

        conn = sqlite3.connect("database.db")
        c = conn.cursor()
        c.execute(
            "INSERT INTO registrations (name, phone, email) VALUES (?, ?, ?)",
            (name, phone, email)
        )
        conn.commit()
        conn.close()

        return render_template("success.html")

    return render_template("register.html")
@app.route("/export")
def export_excel():
    conn = sqlite3.connect("database.db")
    df = pd.read_sql_query("SELECT * FROM registrations", conn)
    conn.close()

    file_name = "inscriptions_event.xlsx"
    df.to_excel(file_name, index=False)

    return send_file(file_name, as_attachment=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT",10000))
    app.run(host="0.0.0.0",port=port)



