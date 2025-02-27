# summary

Query an object, selecting all fields automatically.

# description

Run an Apex Anonymous script, with the ability to pass in variables from the command line and read from stdin. stdin can be accessed in the script via a String variable named `stdin`. Arguments can be accessed via a Map<String, String> variable named `args`.

# examples

placeholder

# flags.file.summary

Path to a local file that contains Apex code.

# flags.dry-run.summary

Print the script that will be run, but do not run it.

# flags.debug-only.summary

Print only log lines with a category of USER_DEBUG.

# flags.key.summary

A key-value pair to pass to the script. Can be specified multiple times. Keys are associated to values by their order of appearance.

# flags.value.summary

A key-value pair to pass to the script. Can be specified multiple times. Keys are associated to values by their order of appearance.

# executeCompileSuccess

Compiled successfully.

# executeCompileFailure

Compilation failed at Line %s column %s with the error:

%s

# executeRuntimeSuccess

Executed successfully.

# executeRuntimeFailure

Execution failed at this code:

%s
