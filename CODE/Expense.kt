package com.miniproject.aismartexpense

data class Expense(
    val merchant: String,
    val amount: String,
    val category: String,
    val date: String = "",
    val time: String = ""
)