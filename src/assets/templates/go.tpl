package main

import (
	"fmt"
	"strings"
	"net/http"
	"io/ioutil"
)

func main() {

	url := "{{{url}}}"
	method := "{{{method}}}"

	payload := strings.NewReader(`{
	{{#body}}
	"{{{key}}}": {{{value}}}{{^last}},{{/last}}
	{{/body}}
	}`)

	client := &http.Client {
	}
	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		fmt.Println(err)
		return
	}
	{{#headers}}
	req.Header.Add("{{{key}}}", {{{value}}})
	{{/headers}}

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(body))
}