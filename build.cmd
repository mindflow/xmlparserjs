@echo off
mkdir target
CMD /C npm run build
CMD /C npm run file
copy /y .\src\*.html .\target\
