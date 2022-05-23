# `tf-http-configuration` #

A terraform http remote backend command configuration generator -- currently targeted
for GitLab configuration(s) only.

## Usage ##

```bash
npx tf-http-configuration@latest
```
              
## Task-Board ##
    
- [ ] Implement automated execution option                                                                                      
- [ ] Implement means for storing multiple configuration variable(s)
- [ ] Incorporate `inquirer-auto-complete` to allow for list of configuration variable(s)
  - See [example](./development/auto-complete.js) for details
- [ ] Provide means for auto-generating:
    ```hcl
     data "http" "gitlab-project-data-source" {
         url = "https://gitlab.company.com/api/v4/projects/[id]"
  
         request_headers = {
             Accept = "Application/JSON"
             Authorization = "Bearer [personal-access-token]"
         }
     }
     ```
