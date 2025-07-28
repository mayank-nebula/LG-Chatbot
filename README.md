EVALUATE
ROW(
    "MaxYearMonth",
    MAXX(
        FILTER(
            'Ignite Metrics',
            'Ignite Metrics'[SUB_INDICATION] = "PC_TOTAL"
        ),
        'Ignite Metrics'[MaxYearMonth]
    )
)
