;(function () {
  'use strict'

  // TextEncoder/TextDecoder polyfills for utf-8 - an implementation of TextEncoder/TextDecoder APIs
  ;(function (window) {
    function TextEncoder() {
      return
    }
    TextEncoder.prototype.encode = function (string) {
      var octets = []
      var length = string.length
      var i = 0
      while (i < length) {
        var codePoint = string.codePointAt(i)
        var c = 0
        var bits = 0
        if (codePoint <= 0x0000007f) {
          c = 0
          bits = 0x00
        } else if (codePoint <= 0x000007ff) {
          c = 6
          bits = 0xc0
        } else if (codePoint <= 0x0000ffff) {
          c = 12
          bits = 0xe0
        } else if (codePoint <= 0x001fffff) {
          c = 18
          bits = 0xf0
        }
        octets.push(bits | (codePoint >> c))
        c -= 6
        while (c >= 0) {
          octets.push(0x80 | ((codePoint >> c) & 0x3f))
          c -= 6
        }
        i += codePoint >= 0x10000 ? 2 : 1
      }
      return octets
    }
    globalThis.TextEncoder = TextEncoder
    if (!window['TextEncoder']) window['TextEncoder'] = TextEncoder

    function TextDecoder() {
      return
    }
    TextDecoder.prototype.decode = function (octets) {
      if (!octets) return ''
      var string = ''
      var i = 0
      while (i < octets.length) {
        var octet = octets[i]
        var bytesNeeded = 0
        var codePoint = 0
        if (octet <= 0x7f) {
          bytesNeeded = 0
          codePoint = octet & 0xff
        } else if (octet <= 0xdf) {
          bytesNeeded = 1
          codePoint = octet & 0x1f
        } else if (octet <= 0xef) {
          bytesNeeded = 2
          codePoint = octet & 0x0f
        } else if (octet <= 0xf4) {
          bytesNeeded = 3
          codePoint = octet & 0x07
        }
        if (octets.length - i - bytesNeeded > 0) {
          var k = 0
          while (k < bytesNeeded) {
            octet = octets[i + k + 1]
            codePoint = (codePoint << 6) | (octet & 0x3f)
            k += 1
          }
        } else {
          codePoint = 0xfffd
          bytesNeeded = octets.length - i
        }
        string += String.fromCodePoint(codePoint)
        i += bytesNeeded + 1
      }
      return string
    }
    globalThis.TextDecoder = TextDecoder
    if (!window['TextDecoder']) window['TextDecoder'] = TextDecoder
  })(
    typeof globalThis == '' + void 0
      ? typeof global == '' + void 0
        ? typeof self == '' + void 0
          ? undefined
          : self
        : global
      : globalThis
  )

  const PROCESSOR_NAME = 'sf2-synth-processor'

  let wasm

  const heap = new Array(32).fill(undefined)

  heap.push(undefined, null, true, false)

  function getObject(idx) {
    return heap[idx]
  }

  let heap_next = heap.length

  function dropObject(idx) {
    if (idx < 36) return
    heap[idx] = heap_next
    heap_next = idx
  }

  function takeObject(idx) {
    const ret = getObject(idx)
    dropObject(idx)
    return ret
  }

  function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1)
    const idx = heap_next
    heap_next = heap[idx]

    heap[idx] = obj
    return idx
  }

  const cachedTextDecoder = new TextDecoder('utf-8', {
    ignoreBOM: true,
    fatal: true,
  })

  cachedTextDecoder.decode()

  let cachedUint8Memory0 = new Uint8Array()

  function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
      cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer)
    }
    return cachedUint8Memory0
  }

  function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len))
  }

  function debugString(val) {
    // primitive types
    const type = typeof val
    if (type == 'number' || type == 'boolean' || val == null) {
      return `${val}`
    }
    if (type == 'string') {
      return `"${val}"`
    }
    if (type == 'symbol') {
      const description = val.description
      if (description == null) {
        return 'Symbol'
      } else {
        return `Symbol(${description})`
      }
    }
    if (type == 'function') {
      const name = val.name
      if (typeof name == 'string' && name.length > 0) {
        return `Function(${name})`
      } else {
        return 'Function'
      }
    }
    // objects
    if (Array.isArray(val)) {
      const length = val.length
      let debug = '['
      if (length > 0) {
        debug += debugString(val[0])
      }
      for (let i = 1; i < length; i++) {
        debug += ', ' + debugString(val[i])
      }
      debug += ']'
      return debug
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val))
    let className
    if (builtInMatches.length > 1) {
      className = builtInMatches[1]
    } else {
      // Failed to match the standard '[object ClassName]'
      return toString.call(val)
    }
    if (className == 'Object') {
      // we're a user defined class or Object
      // JSON.stringify avoids problems with cycles, and is generally much
      // easier than looping through ownProperties of `val`.
      try {
        return 'Object(' + JSON.stringify(val) + ')'
      } catch (_) {
        return 'Object'
      }
    }
    // errors
    if (val instanceof Error) {
      return `${val.name}: ${val.message}\n${val.stack}`
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className
  }

  let WASM_VECTOR_LEN = 0

  const cachedTextEncoder = new TextEncoder('utf-8')

  const encodeString =
    typeof cachedTextEncoder.encodeInto === 'function'
      ? function (arg, view) {
          return cachedTextEncoder.encodeInto(arg, view)
        }
      : function (arg, view) {
          const buf = cachedTextEncoder.encode(arg)
          view.set(buf)
          return {
            read: arg.length,
            written: buf.length,
          }
        }

  function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
      const buf = cachedTextEncoder.encode(arg)
      const ptr = malloc(buf.length)
      getUint8Memory0()
        .subarray(ptr, ptr + buf.length)
        .set(buf)
      WASM_VECTOR_LEN = buf.length
      return ptr
    }

    let len = arg.length
    let ptr = malloc(len)

    const mem = getUint8Memory0()

    let offset = 0

    for (; offset < len; offset++) {
      const code = arg.charCodeAt(offset)
      if (code > 0x7f) break
      mem[ptr + offset] = code
    }

    if (offset !== len) {
      if (offset !== 0) {
        arg = arg.slice(offset)
      }
      ptr = realloc(ptr, len, (len = offset + arg.length * 3))
      const view = getUint8Memory0().subarray(ptr + offset, ptr + len)
      const ret = encodeString(arg, view)

      offset += ret.written
    }

    WASM_VECTOR_LEN = offset
    return ptr
  }

  let cachedInt32Memory0 = new Int32Array()

  function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
      cachedInt32Memory0 = new Int32Array(wasm.memory.buffer)
    }
    return cachedInt32Memory0
  }

  function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1)
    getUint8Memory0().set(arg, ptr / 1)
    WASM_VECTOR_LEN = arg.length
    return ptr
  }

  function isLikeNone(x) {
    return x === undefined || x === null
  }
  /**
   */
  class WasmSoundFontSynth {
    static __wrap(ptr) {
      const obj = Object.create(WasmSoundFontSynth.prototype)
      obj.ptr = ptr

      return obj
    }

    __destroy_into_raw() {
      const ptr = this.ptr
      this.ptr = 0

      return ptr
    }

    free() {
      const ptr = this.__destroy_into_raw()
      wasm.__wbg_wasmsoundfontsynth_free(ptr)
    }
    /**
     * @param {Uint8Array} sf2_bytes
     * @param {number} sample_rate
     * @returns {WasmSoundFontSynth}
     */
    static new(sf2_bytes, sample_rate) {
      const ptr0 = passArray8ToWasm0(sf2_bytes, wasm.__wbindgen_malloc)
      const len0 = WASM_VECTOR_LEN
      const ret = wasm.wasmsoundfontsynth_new(ptr0, len0, sample_rate)
      return WasmSoundFontSynth.__wrap(ret)
    }
    /**
     * @returns {any}
     */
    get_preset_headers() {
      const ret = wasm.wasmsoundfontsynth_get_preset_headers(this.ptr)
      return takeObject(ret)
    }
    /**
     * @param {number} chan
     * @param {number} bank_num
     * @param {number} preset_num
     */
    program_select(chan, bank_num, preset_num) {
      wasm.wasmsoundfontsynth_program_select(
        this.ptr,
        chan,
        bank_num,
        preset_num
      )
    }
    /**
     * @param {number} channel
     * @param {number} key
     * @param {number} vel
     * @param {number | undefined} delay_frame
     */
    note_on(channel, key, vel, delay_frame) {
      wasm.wasmsoundfontsynth_note_on(
        this.ptr,
        channel,
        key,
        vel,
        !isLikeNone(delay_frame),
        isLikeNone(delay_frame) ? 0 : delay_frame
      )
    }
    /**
     * @param {number} channel
     * @param {number} key
     * @param {number | undefined} delay_frame
     */
    note_off(channel, key, delay_frame) {
      wasm.wasmsoundfontsynth_note_off(
        this.ptr,
        channel,
        key,
        !isLikeNone(delay_frame),
        isLikeNone(delay_frame) ? 0 : delay_frame
      )
    }
    /**
     * @param {number} block_size
     * @returns {any}
     */
    read_next_block(block_size) {
      const ret = wasm.wasmsoundfontsynth_read_next_block(this.ptr, block_size)
      return takeObject(ret)
    }
  }

  async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(module, imports)
        } catch (e) {
          if (module.headers.get('Content-Type') != 'application/wasm') {
            console.warn(
              '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
              e
            )
          } else {
            throw e
          }
        }
      }

      const bytes = await module.arrayBuffer()
      return await WebAssembly.instantiate(bytes, imports)
    } else {
      const instance = await WebAssembly.instantiate(module, imports)

      if (instance instanceof WebAssembly.Instance) {
        return { instance, module }
      } else {
        return instance
      }
    }
  }

  function getImports() {
    const imports = {}
    imports.wbg = {}
    imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
      takeObject(arg0)
    }
    imports.wbg.__wbindgen_number_new = function (arg0) {
      const ret = arg0
      return addHeapObject(ret)
    }
    imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
      const ret = getStringFromWasm0(arg0, arg1)
      return addHeapObject(ret)
    }
    imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
      const ret = getObject(arg0)
      return addHeapObject(ret)
    }
    imports.wbg.__wbg_set_20cbc34131e76824 = function (arg0, arg1, arg2) {
      getObject(arg0)[takeObject(arg1)] = takeObject(arg2)
    }
    imports.wbg.__wbg_new_1d9a920c6bfc44a8 = function () {
      const ret = new Array()
      return addHeapObject(ret)
    }
    imports.wbg.__wbg_new_0b9bfdd97583284e = function () {
      const ret = new Object()
      return addHeapObject(ret)
    }
    imports.wbg.__wbg_set_a68214f35c417fa9 = function (arg0, arg1, arg2) {
      getObject(arg0)[arg1 >>> 0] = takeObject(arg2)
    }
    imports.wbg.__wbg_new_abda76e883ba8a5f = function () {
      const ret = new Error()
      return addHeapObject(ret)
    }
    imports.wbg.__wbg_stack_658279fe44541cf6 = function (arg0, arg1) {
      const ret = getObject(arg1).stack
      const ptr0 = passStringToWasm0(
        ret,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc
      )
      const len0 = WASM_VECTOR_LEN
      getInt32Memory0()[arg0 / 4 + 1] = len0
      getInt32Memory0()[arg0 / 4 + 0] = ptr0
    }
    imports.wbg.__wbg_error_f851667af71bcfc6 = function (arg0, arg1) {
      try {
        console.error(getStringFromWasm0(arg0, arg1))
      } finally {
        wasm.__wbindgen_free(arg0, arg1)
      }
    }
    imports.wbg.__wbindgen_debug_string = function (arg0, arg1) {
      const ret = debugString(getObject(arg1))
      const ptr0 = passStringToWasm0(
        ret,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc
      )
      const len0 = WASM_VECTOR_LEN
      getInt32Memory0()[arg0 / 4 + 1] = len0
      getInt32Memory0()[arg0 / 4 + 0] = ptr0
    }
    imports.wbg.__wbindgen_throw = function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1))
    }

    return imports
  }

  function finalizeInit(instance, module) {
    wasm = instance.exports
    init.__wbindgen_wasm_module = module
    cachedInt32Memory0 = new Int32Array()
    cachedUint8Memory0 = new Uint8Array()

    return wasm
  }

  async function init(input) {
    if (typeof input === 'undefined') {
      input = new URL(
        'sf2_synth_audio_worklet_wasm_bg.wasm',
        (document.currentScript && document.currentScript.src) ||
          new URL('processor.js', document.baseURI).href
      )
    }
    const imports = getImports()

    if (
      typeof input === 'string' ||
      (typeof Request === 'function' && input instanceof Request) ||
      (typeof URL === 'function' && input instanceof URL)
    ) {
      input = fetch(input)
    }

    const { instance, module } = await load(await input, imports)

    return finalizeInit(instance, module)
  }

  class SoundFont2SynthProcessor extends AudioWorkletProcessor {
    synth
    sf2Bytes
    constructor() {
      super()
      this.port.onmessage = (event) => this.onmessage(event)
      this.synth = undefined
      this.sf2Bytes = undefined
    }
    onmessage(event) {
      const data = event.data
      if (data.type === 'send-wasm-module') {
        init(WebAssembly.compile(data.wasmBytes)).then(() => {
          this.port.postMessage({ type: 'wasm-module-loaded' })
        })
        this.sf2Bytes = data.sf2Bytes
      } else if (data.type === 'init-synth') {
        if (!this.sf2Bytes) {
          throw new Error('sf2Bytes is undefined')
        }
        this.synth = WasmSoundFontSynth.new(
          new Uint8Array(this.sf2Bytes),
          data.sampleRate
        )
        this.port.postMessage({ type: 'synth-initialized' })
      } else if (data.type === 'send-note-on-event') {
        if (!this.synth) return
        this.synth.note_on(
          data.channel,
          data.key,
          data.vel,
          data.delayTime * data.sampleRate
        )
      } else if (data.type === 'send-note-off-event') {
        if (!this.synth) return
        this.synth.note_off(
          data.channel,
          data.key,
          data.delayTime * data.sampleRate
        )
      }
    }
    process(_inputs, outputs) {
      if (!this.synth) return true
      const outputChannels = outputs[0]
      const blockSize = outputChannels[0].length
      const next_block = this.synth.read_next_block(blockSize)
      outputChannels[0].set(next_block[0])
      outputChannels.length > 1 && outputChannels[1].set(next_block[1])
      // Returning true tells the Audio system to keep going.
      return true
    }
  }
  registerProcessor(PROCESSOR_NAME, SoundFont2SynthProcessor)
})()
//# sourceMappingURL=processor.js.map
