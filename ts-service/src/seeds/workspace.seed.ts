import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { SampleWorkspace } from "../entities/sample-workspace.entity";

export class WorkspaceSeed implements Seeder {
    public async run(dataSource: DataSource) {
        const repository = dataSource.getRepository(SampleWorkspace);

        const defaultWorkspaces = [
            {
                id: "1",
                name: "Default Workspace",
            },
            {
                id: "2",
                name: "Second Workspace",
            },
            {
                id: "3",
                name: "Third Workspace",
            }
        ];

        const allWorkspaces = await repository.find();
        const missingWorkspaces = defaultWorkspaces.filter(workspace => !allWorkspaces.some(w => w.id === workspace.id));
        console.log(`Missing workspaces: ${missingWorkspaces.length}`);
        
        if (missingWorkspaces.length > 0) {
            await repository.save(missingWorkspaces);
        }
    }
}