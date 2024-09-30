if output_dir.exists() and output_dir.is_dir():
        try:
            shutil.rmtree(output_dir)
            logging.info(f"Deleted output directory: {output_dir}")
        except Exception as e:
            logging.error(f"Error deleting output directory: {output_dir}. Error: {e}")
