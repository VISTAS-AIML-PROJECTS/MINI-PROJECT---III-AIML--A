
package com.miniproject.aismartexpense

import kotlin.math.roundToInt

object LinearRegressionPredictor {

    fun predict(values: List<Double>): Double? {

        // No historical data means no prediction.
        if (values.isEmpty()) {
            return null
        }

        // With one month, use its total as a baseline estimate.
        if (values.size == 1) {
            return values.first()
                .coerceAtLeast(0.0)
                .roundToInt()
                .toDouble()
        }

        // Use linear regression when at least two months exist.
        val n = values.size.toDouble()

        val xValues = values.indices.map {
            (it + 1).toDouble()
        }

        val sumX = xValues.sum()
        val sumY = values.sum()

        val sumXY = xValues.zip(values).sumOf {
            it.first * it.second
        }

        val sumXSquare = xValues.sumOf {
            it * it
        }

        val denominator =
            n * sumXSquare - sumX * sumX

        if (denominator == 0.0) {
            return values.last()
                .coerceAtLeast(0.0)
                .roundToInt()
                .toDouble()
        }

        val slope =
            (n * sumXY - sumX * sumY) / denominator

        val intercept =
            (sumY - slope * sumX) / n

        val nextX = values.size + 1.0

        return (intercept + slope * nextX)
            .coerceAtLeast(0.0)
            .roundToInt()
            .toDouble()
    }
}
