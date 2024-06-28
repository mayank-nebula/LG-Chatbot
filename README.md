def has_permission(user_permissions_string, permission_string):
    permissions = set(permission_string.split(';'))
    user_permissions = set(user_permissions_string.split(';'))
    return not user_permissions.isdisjoint(permissions)

# Example usage
permission_string = "HLSConfidential;ADConfidential;EGHConfidential;FTERestricted;USHCConfidential"
user_permissions_string = "HLSConfidential;SomeOtherPermission"

if has_permission(user_permissions_string, permission_string):
    print("User has permission.")
else:
    print("User does not have permission.")
