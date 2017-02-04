@echo off
mkdir target
CMD /C npm run build
CMD /C npm run bundle
copy /y .\src\*.html .\target\
