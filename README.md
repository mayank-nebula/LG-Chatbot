deliverable_permissions = deliverables_list_metadata.get("DeliverablePermissions", "").strip()
        if not deliverable_permissions:
            deliverable_permissions = 'HLSConfidential'
