/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { Component } from 'react';
import { EuiText, EuiFieldText, EuiIcon, EuiSpacer, EuiButton, EuiImage } from '@elastic/eui';
  
class LoginPageProps {
    appBasePath: string;
}

class LoginPageStates {
    username: string;
    password: string;
    loginFailed: boolean;
}

export class LoginPage extends Component<LoginPageProps, LoginPageStates> {
    constructor(props: LoginPageProps) {
        super(props);
        this.state = {username: "", password: "", loginFailed: false}
    }

    onUsernameChange = (e) => {
        this.setState({username: e.target.value})
    }

    onPasswordChange = (e) => {
        this.setState({password: e.target.value})
    }

    onSubmit = () => {
        fetch("auth/login", {
           method: "POST",
           headers: {"kbn-xsrf": "true"},
           body: JSON.stringify({
               "username": this.state.username,
               "password": this.state.password
            }) 
        }).then((response) => {
            if (response.status == 200) {
                // TODO: Parse nextUrl from paras
                window.location.href = this.props.appBasePath + "/..";
            }
            else {
                this.onError(true);
            }
        }).catch((reason) => {
            this.onError(true);
        })
    }

    onError = (flag: boolean) => {
        this.setState({loginFailed: flag})
    }



    render() {
        let errorLabel = null;
        if (this.state.loginFailed) {
            errorLabel = <EuiText id="error" color="danger" textAlign="center"><b>Invalid username or password, please try again</b></EuiText>
        }

        // TODO: Get brand image from server config
        return (<div className="login-wrapper">
            <EuiImage alt="" url="" />
            <EuiSpacer size="s" />
            <EuiText size="m" textAlign="center">Please login to Kibana</EuiText>
            <EuiSpacer size="s" />
            <EuiText size="s" textAlign="center">If you have forgotten your username or password, please ask your system administrator</EuiText>
            <EuiSpacer size="s" />
            <form>
                <EuiFieldText 
                    placeholder="Username"
                    prepend={<EuiIcon type="user" />}
                    onChange={this.onUsernameChange} 
                    value={this.state.username}
                />
                <EuiSpacer size="s" />
                <EuiFieldText 
                    placeholder="Password"
                    prepend={<EuiIcon type="lock" />}
                    type="password"
                    onChange={this.onPasswordChange} 
                    value={this.state.password}
                />
                <EuiSpacer size="s" />
                <EuiButton fill size="s" className="btn-login" onClick={this.onSubmit}>Log In</EuiButton>
                <EuiSpacer size="s" />
                {errorLabel}
            </form>
        </div>)
    }
}

