declare module 'react' {
  export = React;
  export as namespace React;

  namespace React {
    type ReactNode = any;
    type ReactElement<P = any, T = any> = any;
    type JSXElementConstructor<P = any> = any;
    type FC<P = any> = (props: P) => any;
    type ComponentType<P = any> = any;

    interface CSSProperties {
      [key: string]: any;
    }

    interface ChangeEvent<T = Element> {
      target: T & { value: string; checked: boolean };
    }

    interface MouseEvent<T = Element> {
      stopPropagation(): void;
      preventDefault(): void;
    }

    function createElement(type: any, props?: any, ...children: any[]): any;
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useRef<T>(initialValue: T): { current: T };
    function useRef<T = undefined>(): { current: T | undefined };
    function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function useContext<T>(context: any): T;
    function createContext<T>(defaultValue: T): any;
    function StrictMode(props: { children?: any }): any;
  }
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
    unmount(): void;
  };
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    type Element = any;
    interface ElementChildrenAttribute {
      children: any;
    }
  }
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function Fragment(props: any): any;
}
