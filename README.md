# gotorelativepath README

This extension adds a command that will use the current line that the cursor
is on, tokenize it into strings delimited by single or double quote characters
and then check if the cursor position is within one of those strings

If the cursor is inside of a string, the contents of the string are inspected
to see if they look like a relative path.  If it looks like a relative path
then the command will attempt to resolve the file at that relative path 
using the active editor location as the source
