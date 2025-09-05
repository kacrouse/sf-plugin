# summary

Get the sObject type of a record by its ID.

# description

Get the sObject type of a record by its ID.

# flags.record-id.summary

The ID of the record to get the sObject type for.

# examples

- <%= config.bin %> <%= command.id %>

# error.invalidRecordId

The record ID '%s' is not valid. Record IDs must be 15 or 18 characters long.

# error.noOrgId

Could not determine the org ID from the target org. Please ensure you are authenticated to a valid org.

# warning.cacheWriteFailed

Warning: Could not write cache file: %s
