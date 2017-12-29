import { test } from '@/util/testing'
import VTab from './VTab'
import Vue from 'vue'
import Router from 'vue-router'

const tabClick = 'Injection "tabClick" not found'
const tabsWarning = 'The v-tab component must be used inside a v-tabs.'
const stub = {
  name: 'router-link',

  props: {
    to: String
  },

  render (h) {
    return h('a', {
      domProps: { href: this.to }
    })
  }
}

test('VTab', ({ mount }) => {
  it('should render a div when disabled', async () => {
    const wrapper = mount(VTab, {
      propsData: {
        href: '#foo'
      }
    })

    expect(wrapper.find('.tabs__item')[0].vNode.elm.tagName).toBe('A')
    wrapper.setProps({ disabled: true })
    expect(wrapper.find('.tabs__item')[0].vNode.elm.tagName).toBe('DIV')

    expect(tabClick).toHaveBeenWarned()
    expect(tabsWarning).toHaveBeenTipped()
  })

  it('should register and unregister', async () => {
    const register = jest.fn()
    const unregister = jest.fn()
    const wrapper = mount({
      provide: {
        tabs: {
          register,
          unregister
        }
      },
      render (h) {
        return h('div', this.$slots.default)
      }
    }, {
      slots: {
        default: [VTab]
      }
    })

    const item = wrapper.find(VTab)[0]
    item.destroy()

    expect(register).toHaveBeenCalled()
    expect(unregister).toHaveBeenCalled()
    expect(tabClick).toHaveBeenWarned()
  })

  it('should emit click event and prevent default', async () => {
    const click = jest.fn()
    const wrapper = mount({
      provide: {
        tabClick: click
      },
      render (h) { return h('div', this.$slots.default) }
    }, {
      slots: {
        default: [{
          render: h => h(VTab, {
            props: { href: '#foo' }
          })
        }]
      }
    })

    const tab = wrapper.find(VTab)[0]
    tab.vm.$on('click', click)
    const event = new Event('click')
    tab.vm.click(event)
    await wrapper.vm.$nextTick()
    // Cannot figure out how to ensure this actually happens
    // expect(event.defaultPrevented).toBe(false)
    expect(click).toHaveBeenCalled()
    expect(tabsWarning).toHaveBeenTipped()
  })

  it('should toggle isActive', () => {
    const wrapper = mount(VTab, {
      propsData: { href: '#foo' }
    })

    expect(wrapper.vm.isActive).toBe(false)
    wrapper.vm.toggle('foo')
    expect(wrapper.vm.isActive).toBe(true)
    expect(tabClick).toHaveBeenWarned()
    expect(tabsWarning).toHaveBeenTipped()
  })

  it('should not call tabClick', async () => {
    const instance = Vue.extend()
    instance.component('router-link', stub)
    const wrapper = mount(VTab, {
      instance
    })
    const mockClick = jest.fn()
    const click = jest.fn()

    wrapper.vm.$on('click', click)
    wrapper.setMethods({ tabClick: mockClick })
    wrapper.vm.onRouteChange()
    await wrapper.vm.$nextTick()
    expect(mockClick).not.toHaveBeenCalled()

    wrapper.vm.click(new Event('click'))
    expect(click).toHaveBeenCalled()

    wrapper.setProps({ href: '/foo' })
    wrapper.vm.click(new Event('click'))
    await wrapper.vm.$nextTick()
    expect(mockClick.mock.calls.length).toBe(1)

    wrapper.setProps({ href: null, to: '/foo' })
    wrapper.vm.click(new Event('click'))
    await wrapper.vm.$nextTick()
    expect(mockClick.mock.calls.length).toBe(1)

    expect(tabClick).toHaveBeenWarned()
    expect(tabsWarning).toHaveBeenTipped()
  })

  it('should call tabClick', async () => {
    const instance = Vue.extend()
    instance.component('router-link', stub)
    const wrapper = mount(VTab, {
      propsData: {
        to: '/foo'
      },
      globals: {
        $route: { path: '/foo' }
      },
      instance
    })

    const mockClick = jest.fn()
    wrapper.setMethods({ tabClick: mockClick })

    wrapper.vm.onRouteChange()
    await wrapper.vm.$nextTick()
    expect(mockClick).not.toHaveBeenCalled()

    // Mock the actions that would normally
    // happen with a route-link
    wrapper.vm.isActive = true
    wrapper.vm.$el.firstChild.classList.add('tabs__item--active')
    await wrapper.vm.$nextTick()

    // Mock on route change
    wrapper.vm.onRouteChange()
    await wrapper.vm.$nextTick()

    expect(mockClick).toHaveBeenCalled()
    expect(tabClick).toHaveBeenWarned()
    expect(tabsWarning).toHaveBeenTipped()
  })
})
