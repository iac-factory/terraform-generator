import Path from "path";
import OS from "os";
import Assertion from "assert";
import FS from "fs";

import $ from "inquirer";

import type { Question, PasswordQuestionOptions as Password, ListChoiceOptions as List, ChoiceOptions as Choice } from "inquirer";

const { prompt } = $;

const User = OS.userInfo( { encoding: "utf-8" } );

const directory = ".iac";

const { homedir: home } = User;

Assertion.notEqual( directory, undefined, "Unable to Locate \"npm_package_config_directory\" Configuration Environment Variable" );

const target = Path.join( Path.resolve( home ), String( directory ) );

FS.existsSync( target ) || FS.mkdirSync( target );

const Awaitable = async ( duration: number ) => {
    return new Promise( async ( resolve ) => {
        // @ts-ignore
        await setTimeout[Object.getOwnPropertySymbols( setTimeout )[0]]( duration );
        resolve( true );
    } );
};

type Generic = typeof Symbol | string | any;

interface Data {
    instance?: string;
    project?: string;
    environment?: string;
    username?: string;
    token?: string;
}

interface Mapping {
    address: "address" | string;
    lock_address: "lock-address" | string;
    unlock_address: "unlock-address" | string;
    username: "username" | string;
    password: "password" | string;
    lock_method: "lock-method" | string;
    unlock_method: "unlock-method" | string;
    retry_wait_min: "retry-wait-minimum" | string;
}

const Settings: Data = {};

const Questions: Question[] | Password[] | List[] | Choice[] = [
    {
        type: "input",
        name: "instance",
        message: "GitLab Instance Hostname",
        default: () => FS.existsSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-hostname" ) ) )
            ? String( FS.readFileSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-hostname" ) ) ) )
            : "gitlab.com",
        validate( input: string ): boolean | Promise<boolean> {
            Settings.instance = input;
            FS.writeFileSync( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-hostname" ), Settings.instance );
            return !!( input && input !== "" );
        }
    },
    {
        type: "input",
        name: "project",
        message: "Project (Repository) ID",
        validate( input: string ): boolean | Promise<boolean> {
            Settings.project = input;

            return !!( input && input !== "" );
        }
    }, {
        type: "input",
        name: "environment",
        message: "Target Environment",
        default: "Development",
        validate( input: string ): boolean | Promise<boolean> {
            Settings.environment = input;

            return !!( input && input !== "" );
        }
    }, {
        type: "input",
        name: "address",
        message: "Address",
        default: () => "https://" + Settings.instance + "/api/v4/projects/" + Settings.project + "/terraform/state" + "/" + Settings.environment + "",
        validate( input: string ): boolean | Promise<boolean> {
            return !!( input && input !== "" );
        }
    },
    {
        type: "input",
        name: "username",
        message: "Username",
        default: () => FS.existsSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-username" ) ) )
            ? String( FS.readFileSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-username" ) ) ) )
            : null,
        validate( input: string ): boolean | Promise<boolean> {
            Settings.username = input;
            FS.writeFileSync( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-username" ), Settings.username );
            return !!( input && input !== "" );
        }
    },
    {
        type: "password",
        name: "password",
        mask: "*",
        message: "Personal Access Token",
        default: () => FS.existsSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-token" ) ) )
            ? String( FS.readFileSync( String( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-token" ) ) ) )
            : null,
        async validate( input: string ): Promise<boolean> {
            Settings.token = input;
            FS.writeFileSync( Path.join( Path.join( Path.resolve( home ), String( directory ) ), ".gitlab-token" ), Settings.token );
            return !!( input && input !== "" );
        }
    },
    /// @ts-ignore
    {
        type: "list",
        name: "action",
        message: "Action",
        default: "Reconfigure State",

        disabled: [
            "VCS Metadata Variable"
        ],

        choices: [
            "Initialize State",
            "Reconfigure State",
            "Create Backend *.tf File",
            "VCS Project Metadata"
        ]
    }
];

const Answers: Mapping | Generic = JSON.stringify( await prompt( Questions ), null, 4 );

const Configuration: Mapping | Generic = {
    address: JSON.parse( Answers )["address"].trim(),
    lock_address: JSON.parse( Answers )["address"].trim() + "/lock",
    unlock_address: JSON.parse( Answers )["address"].trim() + "/lock",
    username: JSON.parse( Answers )["username"].trim(),
    password: JSON.parse( Answers )["password"].trim(),
    lock_method: "POST",
    unlock_method: "DELETE",
    retry_wait_min: "5"
};

const Output = [
    "terraform {",
    "    backend \"http\" {",
    "        address = \"" + Configuration.address + "\"",
    "        lock_address = \"" + Configuration.address + "/lock" + "\"",
    "        unlock_address = \"" + Configuration.address + "/lock" + "\"",
    "        username = \"" + Configuration.username + "\"",
    "        password = \"" + Configuration.password + "\"",
    "        lock_method = \"" + Configuration.lock_method + "\"",
    "        unlock_method = \"" + Configuration.unlock_method + "\"",
    "        retry_wait_min = 5",
    "     }",
    "}"
].join("\n");

const Initialize = [
    "terraform init \\",
    "    -backend-config=\"address=" + Configuration.address + "\"" + " " + "\\",
    "    -backend-config=\"lock_address=" + Configuration.address + "/lock" + "\"" + " " + "\\",
    "    -backend-config=\"unlock_address=" + Configuration.address + "/lock" + "\"" + " " + "\\",
    "    -backend-config=\"username=" + Configuration.username + "\"" + " " + "\\",
    "    -backend-config=\"password=" + Configuration.password + "\"" + " " + "\\",
    "    -backend-config=\"lock_method=" + Configuration.lock_method + "\"" + " " + "\\",
    "    -backend-config=\"unlock_method=" + Configuration.unlock_method + "\"" + " " + "\\",
    "    -backend-config=\"retry_wait_min=" + Configuration.retry_wait_min + "\""
].join("\n");

const Reconfigure = [
    "terraform init \\",
    "    -backend-config=\"address=" + Configuration.address + "\"" + " " + "\\",
    "    -backend-config=\"lock_address=" + Configuration.address + "/lock" + "\"" + " " + "\\",
    "    -backend-config=\"unlock_address=" + Configuration.address + "/lock" + "\"" + " " + "\\",
    "    -backend-config=\"username=" + Configuration.username + "\"" + " " + "\\",
    "    -backend-config=\"password=" + Configuration.password + "\"" + " " + "\\",
    "    -backend-config=\"lock_method=" + Configuration.lock_method + "\"" + " " + "\\",
    "    -backend-config=\"unlock_method=" + Configuration.unlock_method + "\"" + " " + "\\",
    "    -backend-config=\"retry_wait_min=" + Configuration.retry_wait_min + "\"" + " " + "\\",
    "        -reconfigure"
].join("\n");

/// Consider using an annoyingly long type-ids to avoid
/// potential problems with global namespacing

const id = "gitlab-personal-access-token";

const t = `
/// gitlab.auto.tfvars
${id} = "${Settings.token}"

/// gitlab.auto.tfvars.json
{
    "${id}": "${Settings.token}"
}

/// gitlab.terraform.local.tf
locals {
    gitlab-personal-access-token-file = "gitlab.terraform.auto.tfvars.json"
    gitlab-personal-access-token-file-target = fileexists(join("/", [path.cwd, local.gitlab-personal-access-token-file]))
    gitlab-personal-access-token-file-target-content = (local.gitlab-personal-access-token-file-target) ? file(local.gitlab-personal-access-token-file) : null
}

/// gitlab.terraform.auto.tfvars
variable "${id}" {
    type = string
    default = null
    nullable = true
    
    description = "GitLab Personal Access Token"
}

/// gitlab.terraform.data.tf
data "http" "${id}" {
    url = "https://${Settings.instance}/api/v4/projects/${Settings.project}"

    request_headers = {
        Accept = "Application/JSON"
        Authorization = "Bearer \${var.gitlab-personal-access-token}"
    }
}
`

switch ( JSON.parse( Answers )["action"] ) {
    case "Initialize State":
        console.log(Initialize);
        break;
    case "Reconfigure State":
        console.log(Reconfigure)
        break;
    case "VCS Project Metadata":
        console.log(t);
        break;
    case "Create Backend *.tf File":
        FS.writeFileSync("backend.tf", Output);

        console.log("Created \"backend.tf\" File");

        break;
}
