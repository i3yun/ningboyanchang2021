///<reference types="@i3yun/viewer" />
//初始化资源
Sippreep.Initializer().then(() => {
    let viewer_element = document.getElementById('viewer-element');
    //创建3D视图
    let viewer = new Sippreep.Viewing.Viewer3D(viewer_element);
    //启动并检查WebGL
    const errorCode = viewer.start();
    if (errorCode > 0) {
        console.error('Failed to create a Viewer: WebGL not supported.');
        return;
    }
    //设置光影效果
    viewer.setLightPreset(4);
    /**
     * 应用数据
     */
    let funsData = {
        modelUrls: ['https://www.aisanwei.cn/api/Storge/Viewable?ID=jobs/525b8525-df81-4a65-9a97-f0197ac9c7c3/output/main.hf'//模型1
            , 'https://www.aisanwei.cn/api/Storge/Viewable?ID=jobs/dc6803f8-6871-4adf-98b6-4a508f5aa6ba/output/main.hf'//模型2
        ],
        //当前模型索引
        modelUrlIndex: -1,

        //对象分组属性
        groupAttr: "类别",
        groupIndex: -1,

        //定位聚焦对象集合
        focusedDbids: [],
        focusedDbidIndex: -1,

        //颜色集合
        colors: [new THREE.Vector4(1, 0, 0, 1)//红
            , new THREE.Vector4(0, 1, 0, 1)//绿
            , new THREE.Vector4(0, 0, 1, 1)//蓝
        ],
        //当前颜色索引
        colorIndex: -1,

        //视角集合
        viewStates: [],
        //当前视角索引
        viewStateIndex: -1,
    }
    //应用功能
    let funcs = {
        "切换场景": () => {
            funsData.modelUrlIndex = helperFuncs.getNextIndex(funsData.modelUrlIndex, funsData.modelUrls);

            //清除旧模型
            if (viewer.model)
                viewer.unloadModel(viewer.model);
            //加载新模型
            viewer.loadModel(funsData.modelUrls[funsData.modelUrlIndex], { globalOffset: { x: 0, y: 0, z: 0 } }, (m) => {
                alert("加载模型成功(左键旋转，中键平移，中键滚动缩放)");
            }, (e) => {
                alert("加载模型失败");
            });
        },
        "选中事件订阅": () => {
            if (!funcs.onSelectionChanged) {
                funcs.onSelectionChanged = () => {
                    let dbids = viewer.getSelection();
                    if (dbids.length > 0) {
                        viewer.getProperties(dbids[0], (r) => {

                            alert(`选中对象:"${r.name}"\ndbid(自增id):"${dbids[0]}"\nexternalId(uuid):"${r.externalId}"`);
                        })
                    }
                }
                //订阅选中项改变事件
                viewer.addEventListener(Sippreep.Viewing.SELECTION_CHANGED_EVENT, funcs.onSelectionChanged);

            }
            alert("选中事件订阅成功,请尝试选中对象（设备）");
        },
        "选中事件取消": () => {
            if (funcs.onSelectionChanged) {
                //取消订阅选中项改变事件
                viewer.removeEventListener(Sippreep.Viewing.SELECTION_CHANGED_EVENT, funcs.onSelectionChanged);
                funcs.onSelectionChanged = null;
            }
            alert("选中事件清除成功");
        },
        "定位聚焦对象组(图层)": async () => {
            if (!viewer.model) {
                alert("请先切换场景");
                return;
            }
            /**
             * 加载扩展(模型筛选器)
             * @type Sippreep.Extensions.ModelFilter.ModelFilterExtension
             */
            let filter = await viewer.loadExtension("Sippreep.Extensions.ModelFilter.ModelFilterExtension");
            /**
             * 按类别分组对象
             */
            let groupMap = await filter.listPropertyValueWithObjectId(funsData.groupAttr);
            groupMap.delete(Sippreep.Extensions.ModelFilter.ModelFilterNoPropertyValue);
            /**
             * 获取下一个分组
             */
            let groups = [...groupMap.keys()];
            funsData.groupIndex = helperFuncs.getNextIndex(funsData.groupIndex, groups);
            funsData.focusedDbids = groupMap.get(groups[funsData.groupIndex]);
            //隔离对象
            viewer.isolate(funsData.focusedDbids);
            //聚焦视角
            viewer.fitToView(funsData.focusedDbids);
            //选中对象
            //viewer.select(funsData.focusedDbids);
        },
        "定位聚焦对象": () => {
            if (funsData.focusedDbids.length == 0) {
                alert("请先定位聚焦对象组");
                return;
            }
            //获取下一个对象
            funsData.focusedDbidIndex = helperFuncs.getNextIndex(funsData.focusedDbidIndex, funsData.focusedDbids);
            let dbids = [funsData.focusedDbids[funsData.focusedDbidIndex]];

            //聚焦视角
            viewer.fitToView(dbids);
            //选中对象
            //viewer.select(dbids);
        },
        "定位聚焦清除": () => {
            funsData.focusedDbids = [];
            //取消隔离
            viewer.isolate([]);
            //全局视角
            viewer.fitToView([]);
            //取消选中
            //viewer.select([]);
        },
        "对象颜色设置": () => {
            if (funsData.focusedDbids.length == 0) {
                alert("请先定位聚焦对象");
                return;
            }
            if (funsData.colors.length == 0) {
                alert("请先配置颜色");
                return;
            }

            funsData.colorIndex = helperFuncs.getNextIndex(funsData.colorIndex, funsData.colors);
            funsData.focusedDbids.forEach(dbid => {
                viewer.setThemingColor(dbid, funsData.colors[funsData.colorIndex]);
            });

            //viewer.fitToView(funsData.focusedDbids);
        },
        "对象颜色清除": () => {
            //清除颜色
            viewer.clearThemingColors();
        },
        "视角添加": () => {
            if (!viewer.model) {
                alert("请先切换场景");
                return;
            }
            funsData.viewStates.push(viewer.getState({ viewport: true }));
            alert(`添加视角成功(${funsData.viewStates.length}).`);
        },
        "视角切换": () => {
            if (funsData.viewStates.length == 0) {
                alert("请先添加视角");
                return;
            }

            funsData.viewStateIndex = helperFuncs.getNextIndex(funsData.viewStateIndex, funsData.viewStates);
            viewer.restoreState(funsData.viewStates[funsData.viewStateIndex]);

            // if (funsData.viewStateIndex == funsData.viewStates.length-1)
            //     alert("已到集合结尾");
        },
        "显示对象标记": async () => {
            if (funsData.focusedDbids.length == 0) {
                alert("请先定位聚焦对象");
                return;
            }
            /**
             * 加载扩展(标记管理器)
             * @type Sippreep.Extensions.Markup.Markup3DExtension
             */
            let markup3dApi = await viewer.loadExtension('Sippreep.Extensions.Markup.Markup3DExtension');
            markup3dApi.beginUpdate();
            markup3dApi.getItems().clear();
            funsData.focusedDbids.forEach(dbid => {
                //创建标记
                let item = markup3dApi.getItems().add();
                //设置标记依附对象
                item.anchorDbid = dbid;

                //计算并设置标记显示空间位置
                let fa = new Float32Array(6);
                viewer.model.getInstanceTree().getNodeBox(dbid, fa);
                let box = new THREE.Box3(new THREE.Vector3(fa[0], fa[1], fa[2]), new THREE.Vector3(fa[3], fa[4], fa[5]));
                let a = new Sippreep.Extensions.Markup.Point();
                a.value = box.center().add(new THREE.Vector3(0, 0, box.size().z / 2));
                item.anchor = a;

                //设置标记内容及偏移
                item.content = helperFuncs.getTemp(dbid);
                item.contentOffset = new THREE.Vector2(-16, -16);
            });
            markup3dApi.endUpdate();
        },
        "清除对象标记": async () => {
            /**
             * 加载扩展(模型筛选器)
             * @type Sippreep.Extensions.Markup.Markup3DExtension
             */
            let markup3dApi = await viewer.loadExtension('Sippreep.Extensions.Markup.Markup3DExtension');
            markup3dApi.getItems().clear();
        },
    }
    //辅助工具
    let helperFuncs = {
        showGUI: () => {
            //GUI显示
            var allGui = new dat.GUI({
                closeOnTop: true,
                width: 320
            });
            allGui.domElement.parentNode.style.zIndex = '1';
            for (let name in funcs) {
                allGui.add(funcs, name);
            }
        },
        getNextIndex: (index, array) => {
            let i = index;
            i++;
            if (i >= array.length) {
                return 0;
            }
            else {
                return i;
            }
        },
        getRandomValue: (array) => {
            return array[Math.round(array.length * Math.random())];
        },
        getTemp: (dbid) => {
            return `<img style="width: 32px;height: 32px;" src="https://viewer.aisanwei.cn/logo4.svg"></img>`;

        //     return `<div style="background-color:rgba(255, 255, 255, 0.8);">
        //     <img style="width: 32px;height: 32px;" src="https://viewer.aisanwei.cn/logo4.svg"></img>
        //     <br />
        //     编号：${dbid}
        //   </div>`;
        }
    }
    helperFuncs.showGUI();
});
