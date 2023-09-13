
import { EuiFlexGroup, EuiFlexItem, EuiProgress, EuiText } from "@elastic/eui";
import React from "react";
import zxcvbn from "zxcvbn";

type PasswordStrengthBarProps = {
    password: string
}

export const PasswordStrengthBar = (props: PasswordStrengthBarProps) => {
    const {password} = props;
    const strength = zxcvbn(password).score
    let message;
    switch (strength) {
      case 0:
        message = 'Very weak';
        break;
      case 1:
        message = 'Weak';
        break;
      case 2: 
        message = 'Ok';
        break;
      case 3:
        message = 'Strong';
        break;
      case 4: 
        message = 'Very strong';
        break;
    }

 
    return (
    <EuiFlexGroup alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiText>
          <p>{message}</p>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiProgress value={strength} max={4} size="m" />
      </EuiFlexItem>
    </EuiFlexGroup>
    )
  }