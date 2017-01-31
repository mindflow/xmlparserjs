@echo off
mkdir target
CMD /C npm run build
CMD /C npm run file
CMD /C npm run browser
copy /y .\src\*.html .\target\
