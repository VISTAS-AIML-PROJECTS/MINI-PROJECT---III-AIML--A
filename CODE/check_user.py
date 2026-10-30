import sqlite3
from werkzeug.security import generate_password_hash

email = "kkirthana85@gmail.com"

new_password = input("Enter your NEW password: ")

hashed_password = generate_password_hash(new_password)

conn = sqlite3.connect("smart_donation.db")
cursor = conn.cursor()

cursor.execute("""
    UPDATE users
    SET password = ?
    WHERE email = ?
""", (hashed_password, email))

conn.commit()

if cursor.rowcount == 1:
    print("PASSWORD RESET SUCCESSFUL")
else:
    print("USER NOT FOUND")

conn.close()