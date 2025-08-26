Plugin.register('cosmetic_java_exporter', {
    title: 'Cosmetic Java Exporter',
    author: 'low_kb',
    description: 'Eksportuje modele Blockbench do kodu Java dla kosmetyków Minecraft',
    icon: 'code',
    version: '1.0.0',
    variant: 'both',
    tags: ['Minecraft: Java Edition'],
    
    onload() {
        // Rejestracja formatu
        this.format = new ModelFormat({
            id: 'cosmetic_java',
            name: 'Cosmetic Java Model',
            icon: 'code',
            category: 'minecraft',
            extension: 'java',
            codec: this.codec,
            bone_rig: true,
            box_uv: true,
            centered_grid: true,
            texture_folder: true
        });
        
        // Akcja eksportu
        this.exportAction = new Action('export_cosmetic_java', {
            name: 'Export Cosmetic to Java',
            icon: 'code',
            category: 'file',
            condition: () => Format && Format.id === 'cosmetic_java',
            click: () => this.codec.export()
        });
        
        MenuBar.addAction(this.exportAction, 'file.export');
    },
    
    onunload() {
        if (this.format) this.format.delete();
        if (this.exportAction) this.exportAction.delete();
    }
});

// Codec do generowania kodu Java dla kosmetyków
Plugin.plugins.cosmetic_java_exporter.codec = new Codec('cosmetic_java', {
    name: 'Cosmetic Java Exporter',
    extension: 'java',
    export_name: 'Cosmetic Java Code',
    remember: true,
    
    compile(options) {
        if (!Project) return;
        
        const className = Project.name.replace(/[^a-zA-Z0-9]/g, '') || 'CosmeticModel';
        const packageName = settings.cosmetic_package?.value || 'clientname.cosmetics.impl';
        const textureName = Project.textures[0]?.name?.replace(/\.[^.]+$/, '') || 'default';
        const texturePath = Project.textures[0]?.folder ? 
            `${Project.textures[0].folder}/${textureName}` : 
            textureName;
        
        let javaCode = `package ${packageName};

import net.minecraft.client.Minecraft;
import net.minecraft.client.entity.EntityPlayerSP;
import net.minecraft.client.model.ModelBiped;
import net.minecraft.client.model.ModelRenderer;
import net.minecraft.client.renderer.GlStateManager;
import net.minecraft.client.renderer.Tessellator;
import net.minecraft.client.renderer.WorldRenderer;
import net.minecraft.client.renderer.vertex.DefaultVertexFormats;
import net.minecraft.entity.Entity;
import net.minecraft.util.ResourceLocation;

/**
 * Kosmetyk wygenerowany przez Blockbench Plugin "Cosmetic Java Exporter"
 * dla ${Project.name}
 */
public class ${className} extends ModelBiped {

    private static final ResourceLocation TEXTURE = new ResourceLocation("${settings.resource_domain?.value || 'clientname'}", "textures/${texturePath}.png");

    public void render(EntityPlayerSP player, boolean isSneaking, boolean isFlying, boolean onGround, boolean isSprinting, int id) {
        GlStateManager.pushMatrix();
        
        // Transformacje podstawowe
        setupTransformations(player, isSneaking, isFlying, onGround, isSprinting);
        
        // Załaduj teksturę
        Minecraft.getMinecraft().getTextureManager().bindTexture(TEXTURE);
        
        // Włącz tryby renderowania
        GlStateManager.enableRescaleNormal();
        GlStateManager.enableCull();
        GlStateManager.enableBlend();
        GlStateManager.blendFunc(770, 771);
        
        // Rysuj model
        renderModel();
        
        // Przywróć stan
        GlStateManager.disableBlend();
        GlStateManager.disableCull();
        GlStateManager.popMatrix();
    }
    
    private void setupTransformations(EntityPlayerSP player, boolean isSneaking, boolean isFlying, boolean onGround, boolean isSprinting) {
        // Podstawowe transformacje
        GlStateManager.translate(0.0F, 0.0F, 0.5F);
        GlStateManager.scale(0.8F, 0.8F, 0.8F);
        
        // Dodatkowe transformacje na podstawie stanu gracza
        if (isSneaking) {
            GlStateManager.translate(0.0F, 0.25F, 0.0F);
            GlStateManager.rotate(25.0F, 1.0F, 0.0F, 0.0F);
        }
        
        if (isSprinting) {
            GlStateManager.translate(0.0F, -0.1F, 0.0F);
        }
    }
    
    private void renderModel() {
        Tessellator tessellator = Tessellator.getInstance();
        WorldRenderer worldrenderer = tessellator.getWorldRenderer();
        
        worldrenderer.begin(7, DefaultVertexFormats.POSITION_TEX_NORMAL);
        
`;

        // Generowanie geometrii na podstawie kostek
        let cubeCount = 0;
        Cube.all.filter(cube => cube.export).forEach(cube => {
            const from = cube.from;
            const to = cube.to;
            const width = to[0] - from[0];
            const height = to[1] - from[1];
            const depth = to[2] - from[2];
            const uv = cube.uv_offset || [0, 0];
            const uvWidth = 16; // Domyślna szerokość UV
            const uvHeight = 16; // Domyślna wysokość UV
            
            // Normalizacja współrzędnych UV
            const u1 = uv[0] / Project.texture_width;
            const v1 = uv[1] / Project.texture_height;
            const u2 = (uv[0] + width) / Project.texture_width;
            const v2 = (uv[1] + height) / Project.texture_height;
            
            javaCode += `        // Kostka ${cube.name || `cube${cubeCount}`}
        // Przód
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${to[2]}F).tex(${u2}, ${v2}).normal(0.0F, 0.0F, 1.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${to[2]}F).tex(${u1}, ${v2}).normal(0.0F, 0.0F, 1.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${to[2]}F).tex(${u1}, ${v1}).normal(0.0F, 0.0F, 1.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${to[2]}F).tex(${u2}, ${v1}).normal(0.0F, 0.0F, 1.0F).endVertex();

        // Tył
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${from[2]}F).tex(${u2}, ${v1}).normal(0.0F, 0.0F, -1.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${from[2]}F).tex(${u1}, ${v1}).normal(0.0F, 0.0F, -1.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${from[2]}F).tex(${u1}, ${v2}).normal(0.0F, 0.0F, -1.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${from[2]}F).tex(${u2}, ${v2}).normal(0.0F, 0.0F, -1.0F).endVertex();

        // Lewa ściana
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${from[2]}F).tex(${u2}, ${v2}).normal(-1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${to[2]}F).tex(${u1}, ${v2}).normal(-1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${to[2]}F).tex(${u1}, ${v1}).normal(-1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${from[2]}F).tex(${u2}, ${v1}).normal(-1.0F, 0.0F, 0.0F).endVertex();

        // Prawa ściana
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${to[2]}F).tex(${u2}, ${v2}).normal(1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${from[2]}F).tex(${u1}, ${v2}).normal(1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${from[2]}F).tex(${u1}, ${v1}).normal(1.0F, 0.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${to[2]}F).tex(${u2}, ${v1}).normal(1.0F, 0.0F, 0.0F).endVertex();

        // Górna ściana
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${from[2]}F).tex(${u2}, ${v2}).normal(0.0F, 1.0F, 0.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${to[1]}F, ${to[2]}F).tex(${u1}, ${v2}).normal(0.0F, 1.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${to[2]}F).tex(${u1}, ${v1}).normal(0.0F, 1.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${to[1]}F, ${from[2]}F).tex(${u2}, ${v1}).normal(0.0F, 1.0F, 0.0F).endVertex();

        // Dolna ściana
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${to[2]}F).tex(${u2}, ${v2}).normal(0.0F, -1.0F, 0.0F).endVertex();
        worldrenderer.pos(${from[0]}F, ${from[1]}F, ${from[2]}F).tex(${u1}, ${v2}).normal(0.0F, -1.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${from[2]}F).tex(${u1}, ${v1}).normal(0.0F, -1.0F, 0.0F).endVertex();
        worldrenderer.pos(${to[0]}F, ${from[1]}F, ${to[2]}F).tex(${u2}, ${v1}).normal(0.0F, -1.0F, 0.0F).endVertex();
        
`;
            cubeCount++;
        });
        
        // Zakończenie renderowania
        javaCode += `        tessellator.draw();
    }
    
    // Metoda do renderowania z ModelRenderer (dla kompatybilności)
    public void render(ModelRenderer model, Entity entityIn, int id) {
        GlStateManager.pushMatrix();

        // Transformacje ModelRenderer
        GlStateManager.rotate(model.rotateAngleX * 57.295776F, 1.0F, 0.0F, 0.0F);
        GlStateManager.rotate(model.rotateAngleY * 57.295776F, 0.0F, 1.0F, 0.0F);
        GlStateManager.rotate(model.rotateAngleZ * -57.295776F, 0.0F, 0.0F, 1.0F);

        // Załaduj teksturę i narysuj
        Minecraft.getMinecraft().getTextureManager().bindTexture(TEXTURE);
        renderModel();

        GlStateManager.popMatrix();
    }
}
`;

        return javaCode;
    }
});

// Ustawienia
Settings.add('cosmetic_package', 'clientname.cosmetics.impl', 'string');
Settings.add('resource_domain', 'clientname', 'string');
