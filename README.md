Virtual Network (VNet)
Both VMs are hosted within the same Azure Virtual Network (VNet). This configuration ensures that they can communicate with each other efficiently and securely.
The VNet is configured with a custom address space, ensuring that IP addresses do not overlap with other networks.
Subnets
The VMs are placed in the same subnet within the VNet. This allows for low-latency communication and simplifies the network configuration since no additional routing or network security group (NSG) rules are needed for internal communication between the VMs.
Each VM is assigned a private IP address within this subnet.
Network Security Groups (NSG)
An NSG is associated with the subnet or individual VMs to control inbound and outbound traffic.
For this setup:
Inbound rules allow internal traffic within the VNet to ensure the VMs can communicate without restrictions.
Outbound rules allow necessary traffic, such as updates or communication with other Azure services.
Public IP Addresses
The VMs may or may not have public IP addresses depending on your security requirements.
If public IPs are assigned, ensure that the NSG rules are configured to allow only necessary traffic and restrict access to critical services.
If no public IPs are assigned, the VMs are accessed via an Azure Bastion host or a VPN connection.
