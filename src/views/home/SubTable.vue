<template>
  <form class="converter-form" @submit.prevent="getSubUrl">
    <div class="section-heading">
      <div>
        <span class="section-kicker">Subscription converter</span>
        <h2>生成订阅链接</h2>
      </div>
      <span class="section-badge">{{ targetLabel }}</span>
    </div>

    <div class="field field-wide">
      <label for="subscription-urls">订阅链接或节点</label>
      <textarea
        id="subscription-urls"
        v-model.trim="urls"
        :placeholder="placeholder"
        rows="4"
        spellcheck="false"
      ></textarea>
      <span class="field-hint">每行一条，也支持使用 | 分隔多个链接或节点。</span>
    </div>

    <div class="field-grid">
      <div class="field">
        <label for="client">目标客户端</label>
        <div class="select-wrap">
          <select id="client" v-model="target">
            <option v-for="option in targetOptions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="api">后端服务</label>
        <div class="select-wrap">
          <select id="api" @change="selectApi">
            <option v-for="option in backendOptions" :key="`${option.name}-${option.url}`" :value="option.url">
              {{ option.name }}
            </option>
            <option value="manual">自定义后端 API 地址</option>
          </select>
        </div>
        <div
          v-if="backendProbe.state !== 'idle'"
          class="backend-status"
          :class="`is-${backendProbe.state}`"
          role="status"
          aria-live="polite"
        >
          <span class="backend-status-dot" aria-hidden="true"></span>
          <span>{{ backendProbeText }}</span>
        </div>
      </div>
    </div>

    <div v-if="isShowManualApiUrl" class="field field-wide reveal-block">
      <label for="manual-api">自定义后端 API</label>
      <input id="manual-api" v-model.trim="api" type="url" placeholder="https://sub.example.com" />
    </div>

    <div class="remote-row">
      <div class="field">
        <label for="remote">远程配置</label>
        <div class="select-wrap">
          <select id="remote" @change="selectRemoteConfig">
            <option v-for="option in remoteConfigOptions" :key="`${option.text}-${option.value}`" :value="option.value">
              {{ option.text }}
            </option>
            <option value="manual">自定义远程配置地址</option>
          </select>
        </div>
      </div>
      <button
        class="secondary-button parameter-button"
        type="button"
        :aria-expanded="isShowMoreConfig"
        @click="showMoreConfig"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />
        </svg>
        {{ isShowMoreConfig ? '收起参数' : '可选参数' }}
      </button>
    </div>

    <div v-if="isShowRemoteConfig" class="field field-wide reveal-block">
      <label for="manual-remote">自定义远程配置</label>
      <input id="manual-remote" v-model.trim="remoteConfig" type="url" placeholder="https://example.com/config.ini" />
    </div>

    <section v-if="isShowMoreConfig" class="options-panel reveal-block" aria-label="可选参数">
      <div class="options-inputs">
        <div class="field">
          <label for="include">Include</label>
          <input id="include" v-model="moreConfig.include" placeholder="仅保留匹配节点，可选" />
        </div>
        <div class="field">
          <label for="exclude">Exclude</label>
          <input id="exclude" v-model="moreConfig.exclude" placeholder="排除匹配节点，可选" />
        </div>
      </div>
      <div class="check-grid">
        <label class="check-chip" for="emoji">
          <input id="emoji" v-model="moreConfig.emoji" type="checkbox" />
          <span class="check-mark"></span>
          Emoji
        </label>
        <label class="check-chip" for="udp">
          <input id="udp" v-model="moreConfig.udp" type="checkbox" />
          <span class="check-mark"></span>
          开启 UDP
        </label>
        <label class="check-chip" for="sort">
          <input id="sort" v-model="moreConfig.sort" type="checkbox" />
          <span class="check-mark"></span>
          排序节点
        </label>
        <label class="check-chip" for="scv">
          <input id="scv" v-model="moreConfig.scv" type="checkbox" />
          <span class="check-mark"></span>
          跳过证书验证
        </label>
        <label class="check-chip" for="expand" title="将规则集内联展开到生成的配置中">
          <input id="expand" v-model="moreConfig.expand" type="checkbox" />
          <span class="check-mark"></span>
          使用规则集
        </label>
        <label class="check-chip" for="nodelist">
          <input id="nodelist" v-model="moreConfig.list" type="checkbox" />
          <span class="check-mark"></span>
          Node List
        </label>
      </div>
    </section>

    <div class="section-divider">
      <span></span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
      </svg>
      <span></span>
    </div>

    <div class="result-group">
      <div class="result-copy">
        <label for="result-url">转换结果</label>
        <input id="result-url" v-model.trim="result.subUrl" placeholder="点击转换后自动生成并复制" />
      </div>
      <button class="primary-button" type="submit">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        转换并复制
      </button>
    </div>

    <div v-if="isShortUrlEnabled" class="result-group short-result">
      <div class="result-copy">
        <label for="short-url">短链接</label>
        <input id="short-url" v-model.trim="result.shortUrl" placeholder="生成便于分享的短链接" />
      </div>
      <button class="secondary-button short-url-btn" type="button" :disabled="isShortUrlLoading" @click="getShortUrl">
        <span v-if="isShortUrlLoading" class="spinner" aria-hidden="true"></span>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
        </svg>
        {{ isShortUrlLoading ? '生成中' : '生成短链' }}
      </button>
    </div>
  </form>
</template>

<script>
import { getSubLink, regexCheck } from './index.js';
import { request } from '@/network';
import showNotification from '@/components/notification';

export default {
  name: 'SubTable',
  setup() {
    const DEFAULT_MORECONFIG = {
      include: '',
      exclude: '',
      emoji: true,
      udp: true,
      sort: false,
      scv: false,
      expand: false,
      list: false,
    };
    return {
      DEFAULT_MORECONFIG,
    };
  },
  data() {
    return {
      placeholder: 'https://example.com/subscription\nvmess://...\nss://...',
      targetOptions: [
        { value: 'clash', text: 'Clash' },
        { value: 'clashr', text: 'ClashR' },
        { value: 'v2ray', text: 'V2Ray' },
        { value: 'quan', text: 'Quantumult' },
        { value: 'quanx', text: 'Quantumult X' },
        { value: 'surge&ver=2', text: 'Surge V2' },
        { value: 'surge&ver=3', text: 'Surge V3' },
        { value: 'surge&ver=4', text: 'Surge V4' },
        { value: 'surfboard', text: 'Surfboard' },
        { value: 'ss', text: 'SS (SIP002)' },
        { value: 'sssub', text: 'SS Android' },
        { value: 'ssd', text: 'SSD' },
        { value: 'ssr', text: 'SSR' },
        { value: 'loon', text: 'Loon' },
        { value: 'singbox', text: 'Sing-box' },
      ],
      backendOptions: [],
      api: '',
      shortUrl: window.config.shortUrl,
      remoteConfigOptions: window.config.remoteConfigOptions || [],
      moreConfig: { ...this.DEFAULT_MORECONFIG },
      isShowMoreConfig: false,
      isShowManualApiUrl: false,
      isShowRemoteConfig: false,
      result: {
        subUrl: '',
        shortUrl: '',
      },
      urls: '',
      target: 'clash',
      remoteConfig: window.config.remoteConfigOptions?.[0]?.value || '',
      isShortUrlLoading: false,
      backendProbe: {
        state: 'idle',
        version: '',
      },
      backendProbeController: null,
      backendProbeRequestId: 0,
    };
  },
  computed: {
    isShortUrlEnabled() {
      return window.config.enableShortUrl !== false;
    },
    targetLabel() {
      return this.targetOptions.find((option) => option.value === this.target)?.text || this.target;
    },
    backendProbeText() {
      if (this.backendProbe.state === 'checking') {
        return '正在探测后端';
      }
      if (this.backendProbe.state === 'online') {
        return `在线 · ${this.backendProbe.version || '版本未知'}`;
      }
      return '离线或无法访问';
    },
  },
  created() {
    this.initBackendOptions();
    if (this.api) {
      this.probeBackend(this.api);
    }
  },
  beforeUnmount() {
    this.backendProbeRequestId += 1;
    this.cancelBackendProbe();
  },
  methods: {
    initBackendOptions() {
      const { apiBackends } = window.config;
      if (apiBackends && apiBackends.length > 0) {
        this.backendOptions = apiBackends;
        this.api = apiBackends[0].url;
      }
    },
    showMoreConfig() {
      this.isShowMoreConfig = !this.isShowMoreConfig;
    },
    cancelBackendProbe() {
      if (this.backendProbeController) {
        this.backendProbeController.abort();
        this.backendProbeController = null;
      }
    },
    resetBackendProbe() {
      this.cancelBackendProbe();
      this.backendProbeRequestId += 1;
      this.backendProbe = {
        state: 'idle',
        version: '',
      };
    },
    async probeBackend(api) {
      this.cancelBackendProbe();
      const normalizedApi = api.replace(/\/+$/, '');
      const requestId = this.backendProbeRequestId + 1;
      const controller = new AbortController();
      this.backendProbeRequestId = requestId;
      this.backendProbeController = controller;
      this.backendProbe = {
        state: 'checking',
        version: '',
      };
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${normalizedApi}/version`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const body = (await response.text()).trim();
        const versionMatch = body.match(/^SubConverter-Extended\s+(\S+)\s+backend$/i);
        if (requestId !== this.backendProbeRequestId) {
          return;
        }
        this.backendProbe = {
          state: 'online',
          version: versionMatch?.[1] || '',
        };
      } catch {
        if (requestId !== this.backendProbeRequestId) {
          return;
        }
        this.backendProbe = {
          state: 'offline',
          version: '',
        };
      } finally {
        window.clearTimeout(timeoutId);
        if (this.backendProbeController === controller) {
          this.backendProbeController = null;
        }
      }
    },
    selectApi(event) {
      if (event.target.value === 'manual') {
        this.api = '';
        this.isShowManualApiUrl = true;
        this.resetBackendProbe();
      } else {
        this.isShowManualApiUrl = false;
        this.api = event.target.value;
        this.probeBackend(this.api);
      }
    },
    selectRemoteConfig(event) {
      if (event.target.value === 'manual') {
        this.remoteConfig = '';
        this.isShowRemoteConfig = true;
      } else {
        this.isShowRemoteConfig = false;
        this.remoteConfig = event.target.value;
      }
    },
    async toCopy(url, title) {
      if (!url) {
        this.$showDialog('warning', '注意', '复制失败，内容为空');
        return;
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          const copyInput = document.createElement('textarea');
          copyInput.value = url;
          copyInput.setAttribute('readonly', '');
          copyInput.style.position = 'fixed';
          copyInput.style.opacity = '0';
          document.body.appendChild(copyInput);
          copyInput.select();
          const copied = document.execCommand('copy');
          copyInput.remove();
          if (!copied) {
            throw new Error('Copy command was rejected');
          }
        }
        showNotification(`${title}复制成功`, '成功');
      } catch {
        this.$showDialog('warning', '注意', '复制失败，请手动复制生成的链接');
      }
    },
    getConverter() {
      if (this.urls === '') {
        this.$showDialog('warning', '注意', '请输入订阅链接或节点');
        return false;
      }
      if (!regexCheck(this.api)) {
        this.$showDialog('warning', '注意', '请输入自定义后端 API 地址，或选择默认后端服务。');
        return false;
      }
      if (this.remoteConfig === '' && this.isShowRemoteConfig) {
        this.$showDialog('warning', '注意', '请输入远程配置地址，或选择默认配置。');
        return false;
      }
      if (this.api.endsWith('/')) {
        this.api = this.api.slice(0, -1);
      }
      this.result.subUrl = getSubLink(
        this.urls,
        this.api,
        this.target,
        this.remoteConfig,
        this.isShowMoreConfig,
        this.moreConfig
      );
      return true;
    },
    getSubUrl() {
      if (this.getConverter()) {
        this.toCopy(this.result.subUrl, '订阅链接');
      }
    },
    getShortUrl() {
      if (!this.getConverter()) {
        return;
      }
      this.isShortUrlLoading = true;
      const data = new FormData();
      data.append('longUrl', btoa(this.result.subUrl));
      request({
        method: 'post',
        url: `${this.shortUrl}/short`,
        data,
      })
        .then((res) => {
          if (res.data.Code === 1 && res.data.ShortUrl !== '') {
            this.result.shortUrl = res.data.ShortUrl;
            this.toCopy(this.result.shortUrl, '短链接');
          } else {
            this.$showDialog('error', '失败', '短链接服务未返回有效链接');
          }
        })
        .catch(() => {
          this.$showDialog('error', '失败', '短链接生成失败，请检查短链接服务是否可用');
        })
        .finally(() => {
          this.isShortUrlLoading = false;
        });
    },
  },
};
</script>

<style scoped>
.converter-form {
  display: grid;
  gap: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 4px;
}

.section-kicker {
  display: block;
  margin-bottom: 7px;
  color: var(--accent-blue);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.45rem, 3vw, 1.85rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.section-badge {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 7px 12px;
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent-blue) 22%, transparent);
  border-radius: 999px;
}

.field-grid,
.options-inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.field label,
.result-copy label {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.field-hint {
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.backend-status {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.backend-status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  background: currentColor;
  border-radius: 50%;
}

.backend-status.is-checking {
  color: var(--accent-blue);
}

.backend-status.is-checking .backend-status-dot {
  animation: status-pulse 1s ease-in-out infinite;
}

.backend-status.is-online {
  color: var(--success);
}

.backend-status.is-offline {
  color: var(--danger);
}

input,
select,
textarea {
  display: block;
  width: 100%;
  min-width: 0;
  color: var(--text-primary);
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 16px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

input,
select {
  min-height: 50px;
  padding: 0 15px;
}

textarea {
  min-height: 126px;
  padding: 14px 15px;
  line-height: 1.55;
  resize: vertical;
}

input:hover,
select:hover,
textarea:hover {
  background: var(--control-hover);
}

input:focus,
select:focus,
textarea:focus {
  background: var(--control-hover);
  border-color: color-mix(in srgb, var(--accent-blue) 58%, transparent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
  opacity: 0.72;
}

.select-wrap {
  position: relative;
}

.select-wrap::after {
  position: absolute;
  top: 50%;
  right: 16px;
  width: 8px;
  height: 8px;
  pointer-events: none;
  border-right: 2px solid var(--text-muted);
  border-bottom: 2px solid var(--text-muted);
  content: '';
  transform: translateY(-70%) rotate(45deg);
}

select {
  padding-right: 42px;
  cursor: pointer;
  appearance: none;
}

.remote-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 18px;
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 999px;
  box-shadow: var(--control-shadow);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.primary-button {
  color: #f8fafc;
  background: var(--accent-gradient);
  border-color: transparent;
}

.primary-button:hover,
.secondary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.secondary-button:hover:not(:disabled) {
  background: var(--control-hover);
}

.primary-button svg,
.secondary-button svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.parameter-button {
  min-width: 132px;
}

.options-panel {
  display: grid;
  gap: 17px;
  padding: 18px;
  background: var(--surface-soft);
  border: 1px solid var(--inner-border);
  border-radius: 22px;
}

.check-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.check-chip {
  display: inline-flex;
  min-height: 39px;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 999px;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.check-chip:has(input:checked) {
  color: var(--text-primary);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent-blue) 34%, transparent);
}

.check-chip input {
  position: absolute;
  width: 1px;
  height: 1px;
  min-height: 0;
  opacity: 0;
}

.check-mark {
  display: grid;
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  place-items: center;
  border: 1.5px solid var(--control-border);
  border-radius: 5px;
}

.check-chip input:checked + .check-mark {
  background: var(--accent-gradient);
  border-color: transparent;
}

.check-chip input:checked + .check-mark::after {
  width: 7px;
  height: 4px;
  border-bottom: 2px solid #fff;
  border-left: 2px solid #fff;
  content: '';
  transform: translateY(-1px) rotate(-45deg);
}

.check-chip:has(input:focus-visible) {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

.section-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 13px;
  color: var(--text-muted);
}

.section-divider span {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--inner-border));
}

.section-divider span:last-child {
  background: linear-gradient(90deg, var(--inner-border), transparent);
}

.section-divider svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.result-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
}

.result-copy {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.result-group button {
  min-width: 164px;
}

.short-result {
  padding-top: 17px;
  border-top: 1px solid var(--inner-border);
}

.short-url-btn:disabled {
  cursor: progress;
  opacity: 0.72;
}

.spinner {
  width: 17px;
  height: 17px;
  border: 2px solid color-mix(in srgb, var(--text-primary) 25%, transparent);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.reveal-block {
  animation: reveal 0.24s ease-out;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes status-pulse {
  50% {
    opacity: 0.35;
  }
}

@media (max-width: 680px) {
  .converter-form {
    gap: 17px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 11px;
  }

  .field-grid,
  .options-inputs,
  .remote-row,
  .result-group {
    grid-template-columns: 1fr;
  }

  .parameter-button,
  .result-group button {
    width: 100%;
  }

  .options-panel {
    padding: 15px;
    border-radius: 18px;
  }
}

@media (max-width: 420px) {
  .check-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .check-chip {
    justify-content: flex-start;
    padding-inline: 10px;
  }
}
</style>
