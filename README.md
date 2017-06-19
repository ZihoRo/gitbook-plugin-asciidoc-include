# GitBook Plugin: Asciidoc Include

## 0. 插件安装：
* 之前的版本不一定可用，最低可用版本为 `0.1.8` `book.json` ：
  ```js
  {
      "plugins": [
          "asciidoc-include@0.1.8"
      ]
  }
  ```

* `gitbook` 版本 `book.json`：
  ```js
  {
      "gitbook": ">=2.4.0"
  }
  ```

## 1. 插件配置：
* 配置说明：

  | 键        | 类型   | 值                       | 默认值        | 说明      |
  | --------- | ----- | ------------------------ | ------------ | -------- |
  | `syntax`  | string | 1. `asciidoc` <br/> 2. `gitbook` | `asciidoc`   | 1. 当 `syntax === 'asciidoc'` 时，本插件会将 `include` 语法指向文件的内容与该处 `include` 语法内容替换 <br/> 2. 当 `syntax === 'gitbook'` 时，本插件会将 `include` 语法转化为 `gitbook` 的内容引用语法 |
* 配置示例 `book.json` ：
  ```js
  {
      "pluginsConfig": {
          "asciidoc-include": {
              "syntax": "gitbook"
          }
      }
  }
  ```

## 2. 插件使用：
* 当前目录有 `a.adoc` ， `b.adoc` ， `c.adoc` 两个文件，没有 `d.adoc`：
  * `a.adoc` 内容如下：
    ```asciidoc
    :cPath   : .
    :dPath   : .

    include::./b.adoc[]
    include::{cpath}/c.adoc[]
    include::{dpath}/d.adoc[]

    I'm a.adoc
    ```
  * `b.adoc` 内容如下：
    ```asciidoc
    I'm b.adoc
    ```
  * `c.adoc` 内容如下：
    ```asciidoc
    I'm c.adoc
    ```
  * 在转化成 `HTML` 之前， `asciidoc-include` 插件会查找 `a.adoc` 里面的 `include` 语法，根据配置 `syntax` 的值采用不同的处理方式
    * 转化成 `a.html` 前夕的 `a.adoc` ， `asciidoc` 语法处理方式的结果如下：
      ```asciidoc
      :cPath   : .
      :dPath   : .

      I'm b.adoc
      I'm c.adoc
      include::{dpath}/d.adoc[]

      I'm a.adoc
      ```
    * 转化成 `a.html` 前夕的 `a.adoc` ， `gitbook` 语法处理方式的结果如下：
      ```asciidoc
      :cPath   : .
      :dPath   : .

      {% include "./b.adoc" %}
      {% include "{cpath}/c.adoc" %}
      {% include "{dpath}/d.adoc" %}

      I'm a.adoc
      ```
    * 思考： `gitbook` 方式将 `:cPath   : .` 这种转化成 `{% set cPath = "." %}` 的 `gitbook` 模板语法，然后将 `include` 处改成 `{% include "{{dpath}}/d.adoc" %}` ，在 `{% %}` 里包含 `{{ }}` 不一定可用，暂且记录下来

## 3. 插件注意事项：
* 不能和 `advanced-emoji` 插件混合使用，如果需要使用，方法如下：
  1. 使用我 `fork` 下来的一份插件代码：
      * [advanced-emoji 项目原址](https://github.com/codeclou/gitbook-plugin-advanced-emoji 'advanced-emoji 项目原址')
      * 安装 `book.json` ：
        ```js
        {
            "plugins": [
                "advanced-emoji@git+https://github.com/ZihoRo/gitbook-plugin-advanced-emoji.git"
            ]
        }
        ```
  2. 自己 `fork` ，然后按下面说明修改 `index.js`， `push` 到 `github` ，剩下的就是上一方法的安装，将自己的 `github-url` 替换到 `git+` 之后
      * 修改前
        ```js
        // 省略非关键代码
        module.exports = {
            // 省略非关键代码
            hooks: {
                "page:before": function(page) {
                    if (page.type === "markdown") {
                        // 省略非关键代码
                        return page;
                    }
                    // 此处应该有 return page;
                }
            }
        };
        ```
      * 修改后
        ```js
        // 省略非关键代码
        module.exports = {
            // 省略非关键代码
            hooks: {
                "page:before": function(page) {
                    if (page.type === "markdown") {
                        // 省略非关键代码
                        return page;
                    }
                    return page;
                }
            }
        };
        ```
  3. 向原作者提 `bug` ，我英语不好，就不掺合了

* 我不知道其他插件是否也有同样问题，没有去一一看了
