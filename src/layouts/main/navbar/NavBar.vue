<template>
  <header class="site-header" :class="navStyles">
    <div class="topbar">
      <AppBrand />
      <NavMenu />
    </div>
  </header>
</template>

<script>
import AppBrand from './AppBrand.vue';
import NavMenu from './NavMenu.vue';
export default {
  name: 'NavBar',
  components: {
    AppBrand,
    NavMenu,
  },
  computed: {
    navStyles() {
      // 首页滚动 nav 透明度样式
      return [...this.$store.state.style.main.navStyles].join(' ');
    },
  },
};
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  padding: 16px 20px 0;
  transition: padding 0.2s ease;
}

.topbar {
  display: flex;
  width: min(var(--content-width), 100%);
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
  padding: 10px 12px 10px 18px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 22px;
  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.navbar-active {
  padding-top: 10px;
}

@media (max-width: 720px) {
  .site-header {
    padding: 10px 10px 0;
  }

  .topbar {
    min-height: 58px;
    padding: 8px 10px 8px 14px;
    border-radius: 18px;
  }
}
</style>
