Prerequisites
PuTTY Installation: Ensure that PuTTY is installed on your local machine. You can download it from the official PuTTY website.
Private Key File: You will need the private key file (.ppk) that corresponds to the public key used when creating the VM. If you have the private key in OpenSSH format (.pem), it must be converted to .ppk format using PuTTYgen.
Steps to Connect
Open PuTTY:

Launch the PuTTY application on your local machine.
Configure the Session:

In the "Host Name (or IP address)" field, enter the public IP address of the VM if it has one. If the VM does not have a public IP, you'll need to connect via a VPN or Azure Bastion.
Ensure the "Port" field is set to 22, which is the default port for SSH.
Load the Private Key:

In the "Category" pane, navigate to Connection > SSH > Auth.
Click on the "Browse" button next to the "Private key file for authentication" field.
Select the .ppk file that corresponds to the VM's SSH key.
Set Username:

Navigate back to the "Session" category.
In the "Saved Sessions" field, you can enter a name for this session if you want to save these settings for future use.
In the "Host Name" field, append @ followed by the VM’s username (e.g., azureuser@<VM_IP>).
Connect to the VM:

Click the "Open" button to initiate the connection.
The first time you connect, you may see a security alert regarding the host key. Accept it by clicking "Yes."
Authenticate:

Once the SSH connection is established, you may be prompted for a passphrase if your private key is passphrase-protected.
After successful authentication, you will have shell access to the VM.
