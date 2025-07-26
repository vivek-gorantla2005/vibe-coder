FROM node:21-slim

# Set working directory early to reduce redundant paths
WORKDIR /home/user

# Install required tools in one layer
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy and make compile script executable (only if used)
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Create Next.js app in one step to reduce cache busting
# npx --yes shadcn@2.6.3 init --yes -b neutral --force && \
# npx --yes shadcn@2.6.3 add --all --yes && \
RUN npx --yes create-next-app@15.3.3 nextjs-app --yes && \
    cd nextjs-app && \
    mv ./* ../ && \
    cd .. && rm -rf nextjs-app

CMD ["npx", "next", "dev", "--turbo", "-H", "0.0.0.0"]

