EVALUATE
ROW(
    "LatestMonthYear",
    CALCULATE(
        FIRSTNONBLANK(
            'Final Ex-Factory Sales'[MONTH_YEAR],
            1
        ),
        FILTER(
            'Final Ex-Factory Sales',
            'Final Ex-Factory Sales'[CYCLE_SOURCE_NAME] = "ACT_Finance"
                && 'Final Ex-Factory Sales'[Brand] = "Erleada"
                && NOT ISBLANK('Final Ex-Factory Sales'[MEASURE_VALUE])
        ),
        TOPN(
            1,
            'Final Ex-Factory Sales',
            DATEVALUE('Final Ex-Factory Sales'[Date]),
            DESC
        )
    )
)
