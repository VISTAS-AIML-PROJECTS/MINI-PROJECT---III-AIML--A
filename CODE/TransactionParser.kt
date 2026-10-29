package com.miniproject.aismartexpense

data class ParsedTransaction(
    val merchant: String,
    val amount: Double
)

object TransactionParser {

    fun parse(text: String): ParsedTransaction? {

        if (text.isBlank()) {
            return null
        }

        // Find amounts such as:
        // ₹350
        // ₹1,250
        // ₹350.50
        // Rs.350
        // Rs 350
        // INR 350
        val amountRegex = Regex(
            """(?i)(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)"""
        )

        val amountMatch =
            amountRegex.find(text)

        if (amountMatch == null) {
            return null
        }

        val amount =
            amountMatch
                .groupValues[1]
                .replace(",", "")
                .toDoubleOrNull()
                ?: return null

        // Try "to Merchant"
        val toRegex = Regex(
            """(?i)\bto\s+([A-Za-z0-9&.'_-]+(?:\s+[A-Za-z0-9&.'_-]+){0,3})"""
        )

        val toMatch = toRegex.find(text)

        if (toMatch != null) {

            val merchant =
                toMatch
                    .groupValues[1]
                    .trim()
                    .removeSuffix(".")
                    .trim()

            if (merchant.isNotEmpty()) {

                return ParsedTransaction(
                    merchant = merchant,
                    amount = amount
                )
            }
        }

        // Try "at Merchant"
        val atRegex = Regex(
            """(?i)\bat\s+([A-Za-z0-9&.'_-]+(?:\s+[A-Za-z0-9&.'_-]+){0,3})"""
        )

        val atMatch = atRegex.find(text)

        if (atMatch != null) {

            val merchant =
                atMatch
                    .groupValues[1]
                    .trim()
                    .removeSuffix(".")
                    .trim()

            if (merchant.isNotEmpty()) {

                return ParsedTransaction(
                    merchant = merchant,
                    amount = amount
                )
            }
        }

        return null
    }
}