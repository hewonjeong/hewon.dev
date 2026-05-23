---
title: '[번역] 심층 분석: React Hook은 실제로 어떻게 동작할까?'
date: 2019-11-26
spoiler: 'React Hook에 대해 이해하려면 JavaScript 클로저에 대해 잘 알아야합니다. React의 작은 복제본을 만들어보며 클로저와 hook의 동작 방식을 알아봅니다.'
tags: ['React', 'JavaScript', 'Translation']
---

[Deep dive: How do React hooks really work?](https://www.netlify.com/blog/2019/03/11/deep-dive-how-do-react-hooks-really-work/)을 저자, [Swyx](https://twitter.com/swyx)의 허락을 받고 번역한 글입니다. 오타, 오역은 [제보](https://github.com/hewonjeong/hewon.dev/issues/new)해주시면 수정하도록 하겠습니다.👍🏻

![클로저 다이어그램](closure-diagram.jpg)
_클로저는 함수와 그 함수가 선언됐을 때의 렉시컬 환경(Lexical environment)의 조합이다. - [MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Closures)_

---

> 필자의 노트: 이 글에 내용을 덧붙여 [발표로 만들었습니다](https://www.swyx.io/speaking/react-hooks/). 또한, 이 글에서는 [React 스케줄러](https://www.swyx.io/speaking/react-not-reactive/)나 [상태가 실제로 React에 저장되는 방식](https://medium.com/@dan_abramov/making-sense-of-react-hooks-fdbde8803889)에 대해서는 다루지 않습니다.

기본적으로 [Hooks](https://reactjs.org/hooks)는 UI의 상태 관련 동작 및 부수 작용(side effects)을 캡슐화하는 가장 간단한 방법입니다. [React에서 처음 도입되어](https://www.youtube.com/watch?v=dpw9EHDh2bM), [Vue](https://css-tricks.com/what-hooks-mean-for-vue/)나 [Svelte](https://twitter.com/Rich_Harris/status/1093260097558581250)와 같은 다른 프레임워크에 광범위하게 도입되었으며 심지어는 [일반적인 함수형 자바스크립트](https://github.com/getify/TNG-Hooks)에서도 응용되고 있습니다. 하지만 Hook의 함수 기반 설계를 이해하려면 먼저 JavaScript 클로저에 대해 잘 이해하고 있어야 합니다.

이 글에서는 React Hooks의 작은 복제본을 만들어보며 클로저에 대해 되짚어볼 것입니다. 이는 두 가지 목적이 있습니다. - 클로저를 효과적으로 사용하는 방법에 대해 알아보는 것과 29줄의 읽기 쉬운 JS 코드로 Hook 클론을 구축하는 방법에 대해 살펴보는 것입니다. 최종적으로 어떻게 Custom Hooks가 자연스럽게 나오게 되는지도 알 수 있을 것입니다.

> ⚠️ 주의: Hooks를 이해하기 위해 아래 작업을 수행할 필요는 없습니다. 아래 과정을 따라 해보면 JS 기초에 도움이 될 수 있습니다. 걱정하지는 마세요. 그렇게 어렵지는 않습니다!

## 클로저란 무엇인가?

Hooks가 [내세우는 많은 장점](https://reactjs.org/docs/hooks-intro.html#classes-confuse-both-people-and-machines) 중 하나는 클래스와 고차 컴포넌트의 복잡성을 피할 수 있다는 것입니다. 그러나 hooks를 사용하면 그 문제가 그저 다른 문제로 바뀐 것처럼 느껴지기도 합니다. [bind된 컨텍스트에 대해 걱정](https://overreacted.io/how-are-function-components-different-from-classes/)할 필요가 없는 대신 [클로저에 대해 걱정](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)해야 하기 때문입니다. [Mark Dalgleish](https://twitter.com/markdalgleish/status/1095025468367990784)가 이에 대해 명쾌하게 정리해주었습니다.

![React Hook와 클로저에 관한 스타워즈 드립](tweet-mark-dalgleish-hooks.jpg 'React Hook와 클로저에 관한 스타워즈 드립')

클로저는 JS의 기본적인 개념이지만 많은 갓 시작한 개발자에게 혼란을 주는 것으로도 악명이 높습니다. [You Don’t Know JS](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch6.md)의 저자로 유명한 카일 심슨(Kyle Simpson)은 클로저를 다음과 같이 정의하였습니다.

_클로저는 함수가 속한 렉시컬 스코프를 기억하여 함수가 렉시컬 스코프 밖에서 실행될 때에도 이 스코프에 접근할 수 있게 하는 기능을 뜻한다._

이는 명백히 렉스컬 스코핑(함수가 중첩될 때 파서가 변수의 이름을 해석하는 방법 - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures))의 개념과 밀접한 관련이 있습니다. 더 명쾌하게 설명하기 위해 실용적인 예를 살펴보겠습니다.

```js
// 예제 0
function useState(initialValue) {
  var _val = initialValue // _val은 useState에 의해 만들어진 지역 변수입니다.
  function state() {
    // state는 내부 함수이자 클로저입니다.
    return _val // state()는 부모 함수에 정의된 _val을 참조합니다.
  }
  function setState(newVal) {
    // 마찬가지
    _val = newVal // _val를 노출하지 않고 _val를 변경합니다.
  }
  return [state, setState] // 외부에서 사용하기 위해 함수들을 노출
}
var [foo, setFoo] = useState(0) // 배열 구조분해 사용
console.log(foo()) // 0 출력 - 위에서 넘긴 initialValue
setFoo(1) // useState의 스코프 내부에 있는 _val를 변경합니다.
console.log(foo()) // 1 출력 - 동일한 호출하지만 새로운 initialValue
```

React의 `useState` Hook의 아주 기본적인 형태의 복제본을 만들어 보았습니다. 이 함수에는 `state`와 `setState`라는 두 개의 내부 함수가 있습니다. `state`는 상단에 정의된 지역 변수 `_val`를 반환하고, `setState`는 전달 된 매개 변수 (예: `newVal`)로 지역 변수를 설정합니다.

여기서 `state`는 게터 함수로 구현하여 [이상적이지는 않지만](https://twitter.com/sebmarkbage/status/1098809296396009472), 이는 조금 뒤에 수정하겠습니다. 중요한 것은 `foo`와 `setFoo`를 사용하여 내부 변수 `_val`에 접근하고 조작(일명 “덮어쓰기”) 할 수 있다는 것입니다. 이 둘은 `useState`의 스코프에 대한 접근 권한을 가지고 있고, 이러한 참조를 클로저라고 합니다. React와 다른 프레임워크의 맥락에서 보면 이것은 '상태'라고 할 수 있고 실제로도 그렇습니다.

클로저에 대해 더 자세히 알아보려면 [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures), [YDKJS](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch6.md) 및 [DailyJS](https://medium.com/dailyjs/i-never-understood-javascript-closures-9663703368e8)에서 해당 주제에 대해 읽어보는 것을 추천합니다. 하지만 위의 샘플 코드가 이해된다면 그 정도로도 충분합니다.

## 함수형 컴포넌트에서 사용하기

새로 만든 `useState` 복제본을 익숙한 형태에 적용해보겠습니다. `Counter` 컴포넌트를 만들어보겠습니다!

```js
// 예제 1
function Counter() {
  const [count, setCount] = useState(0) // 위에 useState와 같음
  return {
    click: () => setCount(count() + 1),
    render: () => console.log('render:', { count: count() }),
  }
}
const C = Counter()
C.render() // render: { count: 0 }
C.click()
C.render() // render: { count: 1 }
```

여기서는 DOM으로 렌더링하는 대신 상태를 `console.log`로 출력하도록 하겠습니다. 또한 카운터에 프로그램적인 API를 노출하여 이벤트 핸들러를 붙이는 대신 스크립트로 실행할 수 있도록 하였습니다. 이러한 설계를 통해 컴포넌트 렌더링을 시뮬레이션하고 사용자 작업에 반응할 수 있습니다.

이 코드가 동작할 때 상태(state)에 접근하기 위해 게터 함수를 호출하는 것은 실제 `React.useState` hook의 API와 다릅니다. 이것도 수정해보도록 하겠습니다.

## 오래된 클로저 (Stale Closure)

실제 React API와 동일하게 만들려면 state가 함수가 아닌 변수여야 합니다. 단순히 `_val`을 함수로 감싸지 않고 노출하면 버그가 발생합니다.

```js
// 예제 0, 다시보기 - 버그 있음 주의!
function useState(initialValue) {
  var _val = initialValue
  // state() 함수 없음
  function setState(newVal) {
    _val = newVal
  }
  return [_val, setState] // _val를 그대로 노출
}
var [foo, setFoo] = useState(0)
console.log(foo) // 함수 호출 할 필요 없이 0 출력
setFoo(1) // useState의 스코프 내부에 있는 _val를 변경합니다.
console.log(foo) // 0 출력 - 헐!!
```

이것은 오래된 클로저 문제의 한 형태입니다. `useState`의 결과에서 `foo`를 비구조화할 때 초기 `useState` 호출에서 `_val`을 참조하고… 다시는 변경되지 않습니다! 이는 우리가 의도한 바와 다릅니다. 일반적으로 _현재_ 상태를 반영하기 위해 컴포넌트의 상태가 필요하지만, 이는 함수 호출이 아닌 단지 변수일 뿐입니다! 이 두 가지 목표는 절대 같이 갈 수 없는 것처럼 보입니다.

## 모듈 안에서의 클로저

이 `useState`의 난제는... 우리의 클로저를 또 다른 클로저의 내부로 이동시켜서 해결할 수 있습니다! (_클로저를 좋아하는 것 같아서 일단 더 넣어봤어…_)

```js
// 예제 2
const MyReact = (function () {
  let _val // 모듈 스코프 안에 state를 잡아놓습니다.
  return {
    render(Component) {
      const Comp = Component()
      Comp.render()
      return Comp
    },
    useState(initialValue) {
      _val = _val || initialValue // 매 실행마다 새로 할당됩니다.
      function setState(newVal) {
        _val = newVal
      }
      return [_val, setState]
    },
  }
})()
```

작은 React 복제본을 만들기 위해 [모듈 패턴](https://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript)을 사용하였습니다. React와 마찬가지로 컴포넌트의 상태를 추적합니다. (이 예제에서는 `_val`로 한 컴포넌트의 상태만 추적). 이 설계를 통해 `MyReact`는 함수형 컴포넌트를 "render"할 수 있고, 매번 항상 올바른 클로저를 통해 내부의 `_val` 값을 할당할 수 있습니다.

```js
// 예제 2로 부터 이어짐
function Counter() {
  const [count, setCount] = MyReact.useState(0)
  return {
    click: () => setCount(count + 1),
    render: () => console.log('render:', { count }),
  }
}
let App
App = MyReact.render(Counter) // render: { count: 0 }
App.click()
App = MyReact.render(Counter) // render: { count: 1 }
```

이제 React의 Hooks와 훨씬 비슷해졌습니다!

[YDKJS에서 모듈 패턴과 클로저에 대한 더 자세한 내용](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch6.md#modules)을 읽을 수 있습니다.

## `useEffect` 복제하기

지금까지 첫 번째 기본 React Hook인 `useState`에 대해 살펴보았습니다. 다음으로 가장 중요한 Hook은 `useEffect`입니다. `setState`와 달리 `useEffect`는 비동기로 실행되므로 클로저 문제가 발생할 가능성이 더 높습니다.

지금까지 만들어놓은 작은 React 모델에 `useEffect`를 추가해보겠습니다.

```js
// Example 3
const MyReact = (function () {
  let _val, _deps // 스코프 안에서 상태와 의존성을 잡아 놓습니다.
  return {
    render(Component) {
      const Comp = Component()
      Comp.render()
      return Comp
    },
    useEffect(callback, depArray) {
      const hasNoDeps = !depArray
      const hasChangedDeps = _deps
        ? !depArray.every((el, i) => el === _deps[i])
        : true
      if (hasNoDeps || hasChangedDeps) {
        callback()
        _deps = depArray
      }
    },
    useState(initialValue) {
      _val = _val || initialValue
      function setState(newVal) {
        _val = newVal
      }
      return [_val, setState]
    },
  }
})()

// 사용하는 곳
function Counter() {
  const [count, setCount] = MyReact.useState(0)
  MyReact.useEffect(() => {
    console.log('effect', count)
  }, [count])
  return {
    click: () => setCount(count + 1),
    noop: () => setCount(count),
    render: () => console.log('render', { count }),
  }
}
let App
App = MyReact.render(Counter)
// 이펙트 0
// render {count: 0}
App.click()
App = MyReact.render(Counter)
// 이펙트 1
// render {count: 1}
App.noop()
App = MyReact.render(Counter)
// // 이펙트가 실행되지 않음
// render {count: 1}
App.click()
App = MyReact.render(Counter)
// 이펙트 2
// render {count: 2}
```

의존성을 추적하기 위해(의존성이 변경될 때 `useEffect`가 다시 실행되므로), 이를 추적하는 별도의 변수, `_deps`를 추가하였습니다.

## 마법이 아니라 배열일 뿐

지금까지 `useState`와 `useEffect`의 기능을 그럴듯하게 갖춘 복제본을 만들었습니다. 하지만 둘 다 잘못 구현된 [싱글톤](https://en.wikipedia.org/wiki/Singleton_pattern) 형태입니다. (각각 하나 이상이 존재하면 버그가 발생합니다.) 좀 더 흥미로운 것들을 구현하려면 (그리고 오래된 클로저에 대한 마지막 예제를 보여드리려면) 여러 개의 상태(state)와 효과(effect)를 받을 수 있는 일반적인 형태로 구현되어야 합니다. 다행히 [Rudi Yardley의 글처럼](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e), React Hooks는 마법이 아니라 배열일 뿐입니다. `hooks` 배열을 추가해봅시다. 또한 `_val`과 `_deps`가 서로 겹쳐지지 않기 때문에 `hooks` 배열에 하나로 합칠 수 있습니다.

```js
// 예제 4
const MyReact = (function () {
  let hooks = [],
    currentHook = 0 // Hook 배열과 반복자(iterator)!
  return {
    render(Component) {
      const Comp = Component() // 이펙트들이 실행된다.
      Comp.render()
      currentHook = 0 // 다음 렌더를 위해 초기화
      return Comp
    },
    useEffect(callback, depArray) {
      const hasNoDeps = !depArray
      const deps = hooks[currentHook] // type: array | undefined
      const hasChangedDeps = deps
        ? !depArray.every((el, i) => el === deps[i])
        : true
      if (hasNoDeps || hasChangedDeps) {
        callback()
        hooks[currentHook] = depArray
      }
      currentHook++ // 이 Hook에 대한 작업 완료
    },
    useState(initialValue) {
      hooks[currentHook] = hooks[currentHook] || initialValue // type: any
      const setStateHookIndex = currentHook // setState의 클로저를 위해!
      const setState = (newState) => (hooks[setStateHookIndex] = newState)
      return [hooks[currentHook++], setState]
    },
  }
})()
```

여기서 `setStateHookIndex`를 사용하는 것이 아무 의미 없는 것처럼 보이지만, `setState`에서 `currentHook` 변수가 덮어 씌워지는 것을 방지하는 데 사용됩니다! 해당 부분을 제거하면, 덮어 씌워진 `currentHook`은 오래된 클로저 문제를 일으켜 `setState`를 다시 호출했을 때 동작하지 않습니다. (직접 시도해보세요!)

```js
// 예제 4로 부터 이어짐 - 사용하는 곳
function Counter() {
  const [count, setCount] = MyReact.useState(0)
  const [text, setText] = MyReact.useState('foo') // 두번 째 상태 Hook!
  MyReact.useEffect(() => {
    console.log('effect', count, text)
  }, [count, text])
  return {
    click: () => setCount(count + 1),
    type: (txt) => setText(txt),
    noop: () => setCount(count),
    render: () => console.log('render', { count, text }),
  }
}
let App
App = MyReact.render(Counter)
// 이펙트 0 foo
// render {count: 0, text: 'foo'}
App.click()
App = MyReact.render(Counter)
// 이펙트 1 foo
// render {count: 1, text: 'foo'}
App.type('bar')
App = MyReact.render(Counter)
// 이펙트 1 bar
// render {count: 1, text: 'bar'}
App.noop()
App = MyReact.render(Counter)
// // 이펙트가 실행되지 않음
// render {count: 1, text: 'bar'}
App.click()
App = MyReact.render(Counter)
// 이펙트 2 bar
// render {count: 2, text: 'bar'}
```

위와 같이, 기본적인 개념은 Hook의 배열과 각 Hook이 호출될 때 증가하고 컴포넌트가 렌더링 될 때 초기화되는 인덱스를 갖는 것입니다.

여기까지 왔다면 [custum hooks](https://reactjs.org/docs/hooks-custom.html)에 대한 이해는 어려울 것이 전혀 없습니다.

```js
// 예제 4, 다시보기
function Component() {
  const [text, setText] = useSplitURL('www.netlify.com')
  return {
    type: (txt) => setText(txt),
    render: () => console.log({ text }),
  }
}
function useSplitURL(str) {
  const [text, setText] = MyReact.useState(str)
  const masked = text.split('.')
  return [masked, setText]
}
let App
App = MyReact.render(Component)
// { text: [ 'www', 'netlify', 'com' ] }
App.type('www.reactjs.org')
App = MyReact.render(Component)
// { text: [ 'www', 'reactjs', 'org' ] }}
```

**이것은 Hook이 "마술이 아니라는 것"을 명백히 보여줍니다.** – 커스텀 Hook은 프레임워크가 제공하는 원형(그것이 React이든, 우리가 만든 작은 복제본이든)으로 부터 쉽게 빠져나옵니다.

## Hook 규칙 도출하기

이제 [Hook 규칙](https://reactjs.org/docs/hooks-rules.html) 중 첫 번째인 ["최상위에서만 Hook을 호출해야 합니다"](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-at-the-top-level)를 대략 이해할 수 있을 것입니다. `currentHook` 변수를 사용하여 호출 순서에 대한 React의 의존성을 명시적으로 모델링 했습니다. 우리가 구현한 것을 염두에 두고 [전체 규칙에 대한 설명](https://reactjs.org/docs/hooks-rules.html#explanation) 부분을 읽어보면 전체 맥락이 잘 이해될 것입니다.

또한 두 번째 규칙인 ["오직 React 함수 내에서 Hook을 호출해야 합니다."](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions)는 우리가 구현한 코드에서는 필수적이지 않지만, 항상 코드의 어떤 부분이 상태 관련 로직에 의존하는지 명확하게 구분하는 것은 좋은 습관입니다. (긍정적인 부수효과로, 반복문과 조건문 내부에서 일반 JavaScript 함수처럼 이름 붙여진 상태 관련 함수를 호출하는 실수를 하지 않게 됩니다. 즉, 두 번째 규칙을 따르는 것이 첫 번째 규칙을 따르는 데 도움이 됩니다.)

## 결론

여기까지 이 글에서 학습해볼 내용은 다 다루었습니다. 이제 [useRef를 한 줄로 구현해보거나](https://www.reddit.com/r/reactjs/comments/aufijk/useref_is_basically_usestatecurrent_initialvalue_0/) [render 함수가 JSX를 받아 실제로 DOM에 마운트 하도록 해보거나](https://www.npmjs.com/package/vdom) 우리가 구현한 28줄의 React Hooks 복제본에서는 생략한 무수히 많은 세부 사항을 추가해볼 수도 있습니다. 아무쪼록 컨텍스트에서 클로저를 사용하는 경험과 React Hook이 동작하는 방식을 이해하는 유용한 멘탈 모델을 얻으셨기를 바랍니다.

_이 글의 초안을 검토하고 값진 피드백으로 개선해 준 [Dan Abramov](https://twitter.com/dan_abramov)와 [Divya Sasidharan](https://twitter.com/shortdiv)에게 감사의 말을 전합니다. 오류가 남아있다면 그건 제 탓입니다.._
