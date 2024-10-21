def stop_service(service_name):
    """
    Stops a service using systemctl.

    Args:
        service_name (str): The name of the service to stop.
    """
    try:
        # Run the systemctl stop command
        subprocess.run(["sudo", "systemctl", "stop", service_name], check=True)
        logging.info(f"Successfully stopped {service_name}")
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to stop {service_name}: {e}")
    except Exception as e:
        logging.error(f"An error occurred while stopping {service_name}: {e}")
