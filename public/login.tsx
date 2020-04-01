import { AppMountParameters } from "../../../src/core/public";
import ReactDOM from "react-dom";

export function renderApp(
  params: AppMountParameters
  // basePath: string
) {

  ReactDOM.render(
    <div>
      login page
    </div>,
    params.element);
  return () => ReactDOM.unmountComponentAtNode(params.element);
}