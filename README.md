EVALUATE
SELECTCOLUMNS(
    TOPN(
        1,
        FILTER(
            'Ignite Metrics',
            NOT ISBLANK('Ignite Metrics'[DATE_ID])
        ),
        DATEVALUE('Ignite Metrics'[DATE_ID]),
        DESC
    ),
    "LatestYearMonth", 'Ignite Metrics'[DATE_ID]
)
