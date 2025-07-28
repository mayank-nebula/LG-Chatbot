EVALUATE
SELECTCOLUMNS(
    TOPN(
        1,
        FILTER(
            'Ignite Metrics',
            'Ignite Metrics'[SUB_INDICATION] = "PC_TOTAL"
                && NOT ISBLANK('Ignite Metrics'[MaxYearMonth])
        ),
        'Ignite Metrics'[MaxYearMonth],
        DESC
    ),
    "LatestMonthYear", DATEVALUE('Ignite Metrics'[WAVE_DATE])
)
