Restarting the Pipeline After Failure

If the pipeline fails, follow these steps to restart it:
Step-by-Step Instructions
1.	Restart Flask Pipeline Service in VM1 () – sudo systemctl restart flask_pipeline.

2.	Restart Ollama Service in VM2 () – sudo systemctl restart ollama.

3.	Check the Last Processed File
•	Open the pipeline.log file.
•	Identify the last successfully processed file by reviewing the log entries.

4.	Clean Up Directories and Files
•	Delete any files present in the files_to_ingest directory.
•	Delete the output and figures directories.

5.	Update the Metadata File
•	Open files_metadata.csv file.
•	Identify the row of the last processed file and delete all rows below this row.

6.	Access Flask Pipeline
•	Navigate to the pipeline URL to ensure it is running.
•	Click on Start Pipeline to start the pipeline.

