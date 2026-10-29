package com.miniproject.aismartexpense

import android.content.ContentValues
import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DatabaseHelper(context: Context) {

    private val dbHelper = ExpenseDatabaseHelper(context)

    fun addExpense(
        merchant: String,
        amount: Double,
        category: String
    ) {

        val db = dbHelper.writableDatabase

        val values = ContentValues().apply {
            put("merchant", merchant)
            put("amount", amount)
            put("category", category)
            put("created_at", System.currentTimeMillis())
        }

        db.insert(
            "expenses",
            null,
            values
        )

        db.close()
    }

    fun isDuplicateRecentExpense(
        merchant: String,
        amount: Double
    ): Boolean {

        val db = dbHelper.readableDatabase

        val twoMinutesAgo =
            System.currentTimeMillis() - (2 * 60 * 1000)

        val cursor = db.query(
            "expenses",
            arrayOf("id"),
            "merchant = ? AND amount = ? AND created_at >= ?",
            arrayOf(
                merchant,
                amount.toString(),
                twoMinutesAgo.toString()
            ),
            null,
            null,
            null,
            "1"
        )

        val exists = cursor.moveToFirst()

        cursor.close()
        db.close()

        return exists
    }

    fun getAllExpenses(): ArrayList<Expense> {

        val expenses = ArrayList<Expense>()

        val db = dbHelper.readableDatabase

        val cursor = db.query(
            "expenses",
            null,
            null,
            null,
            null,
            null,
            "created_at DESC"
        )

        val dateFormat =
            SimpleDateFormat(
                "dd MMM yyyy",
                Locale.getDefault()
            )

        val timeFormat =
            SimpleDateFormat(
                "hh:mm a",
                Locale.getDefault()
            )

        while (cursor.moveToNext()) {

            val merchant =
                cursor.getString(
                    cursor.getColumnIndexOrThrow("merchant")
                )

            val amount =
                cursor.getDouble(
                    cursor.getColumnIndexOrThrow("amount")
                )

            val category =
                cursor.getString(
                    cursor.getColumnIndexOrThrow("category")
                )

            val createdAt =
                cursor.getLong(
                    cursor.getColumnIndexOrThrow("created_at")
                )

            val date =
                dateFormat.format(
                    Date(createdAt)
                )

            val time =
                timeFormat.format(
                    Date(createdAt)
                )

            expenses.add(
                Expense(
                    merchant = merchant,
                    amount = "₹${String.format("%.2f", amount)}",
                    category = category,
                    date = date,
                    time = time
                )
            )
        }

        cursor.close()
        db.close()

        return expenses
    }

    fun getMonthlyExpenseTotals(): List<Double> {

        val totals = ArrayList<Double>()

        val db = dbHelper.readableDatabase

        val cursor = db.rawQuery(
            """
            SELECT 
                strftime(
                    '%Y-%m',
                    datetime(
                        created_at / 1000,
                        'unixepoch',
                        'localtime'
                    )
                ) AS month,
                SUM(amount) AS total
            FROM expenses
            GROUP BY month
            ORDER BY month ASC
            """.trimIndent(),
            null
        )

        while (cursor.moveToNext()) {

            val total =
                cursor.getDouble(
                    cursor.getColumnIndexOrThrow("total")
                )

            totals.add(total)
        }

        cursor.close()
        db.close()

        return totals
    }

    fun deleteExpense(
        merchant: String,
        amount: Double,
        category: String
    ) {

        val db = dbHelper.writableDatabase

        db.delete(
            "expenses",
            "merchant = ? AND amount = ? AND category = ?",
            arrayOf(
                merchant,
                amount.toString(),
                category
            )
        )

        db.close()
    }
}

private class ExpenseDatabaseHelper(
    context: Context
) : android.database.sqlite.SQLiteOpenHelper(
    context,
    "expenses.db",
    null,
    2
) {

    override fun onCreate(db: android.database.sqlite.SQLiteDatabase) {

        db.execSQL(
            """
            CREATE TABLE expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merchant TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(
        db: android.database.sqlite.SQLiteDatabase,
        oldVersion: Int,
        newVersion: Int
    ) {

        if (oldVersion < 2) {

            // Existing database is preserved.
            // created_at is added only if required.
            try {
                db.execSQL(
                    "ALTER TABLE expenses ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0"
                )
            } catch (_: Exception) {
                // Column already exists.
            }
        }
    }
}