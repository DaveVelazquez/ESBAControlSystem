# Code Citations

## License: unknown
https://github.com/zeroproject-dev/automatons/tree/caed24b5c26355c6498d90e5996e7093d16048a8/Dockerfile

```
nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"
```


## License: unknown
https://github.com/team-siksik/hearo/tree/6e026e3ceaec75bff5d1032d430530d2e273e3a5/exec/2_%ED%99%98%EA%B2%BD%EC%84%A4%EC%A0%95.md

```
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
``
```

